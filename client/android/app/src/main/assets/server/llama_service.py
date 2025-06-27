#!/usr/bin/env python3
"""
Llama Service for Old Mate - Offline AI Chat
Uses DeepSeek-R1 model via llama-cpp-python
"""

from flask import Flask, request, jsonify
from llama_cpp import Llama
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Model path - adjust as needed
MODEL_PATH = "../DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf"
if not os.path.exists(MODEL_PATH):
    # Try alternative path
    MODEL_PATH = "../llama.cpp/models/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf"

# Initialize the model
llm = None

def load_model():
    global llm
    try:
        logger.info(f"Loading model from: {MODEL_PATH}")
        llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=4096,  # Context length
            n_threads=4,  # Number of CPU threads
            verbose=False
        )
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": llm is not None,
        "model_path": MODEL_PATH
    })

@app.route('/generate', methods=['POST'])
def generate_text():
    global llm
    
    if llm is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "No prompt provided"}), 400
        
        prompt = data['prompt']
        max_tokens = data.get('max_tokens', 512)
        temperature = data.get('temperature', 0.7)
        
        logger.info(f"Generating response for prompt length: {len(prompt)}")
        
        # Generate response
        response = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stop=["Human:", "User:", "\n---"],
            echo=False,
            stream=False
        )
        
        generated_text = response.get('choices', [{}])[0].get('text', '').strip()
        usage = response.get('usage', {})
        
        return jsonify({
            "text": generated_text,
            "tokens_used": usage.get('total_tokens', 0)
        })
        
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible chat completions endpoint"""
    global llm
    
    if llm is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        # Convert messages to a single prompt
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'system':
                prompt += f"System: {content}\n\n"
            elif role == 'user':
                prompt += f"Human: {content}\n\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n\n"
        
        prompt += "Assistant: "
        
        # Generate response
        response = llm(
            prompt,
            max_tokens=data.get('max_tokens', 512),
            temperature=data.get('temperature', 0.7),
            stop=["Human:", "User:", "System:", "\n---"],
            echo=False,
            stream=False
        )
        
        generated_text = response.get('choices', [{}])[0].get('text', '').strip()
        usage = response.get('usage', {})
        
        # Return in OpenAI format
        return jsonify({
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": generated_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "total_tokens": usage.get('total_tokens', 0)
            }
        })
        
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Llama Service...")
    
    # Try to load the model
    if load_model():
        logger.info("Starting Flask server on port 8080...")
        app.run(host='0.0.0.0', port=8080, debug=False)
    else:
        logger.error("Could not load model, exiting...")
        exit(1)
