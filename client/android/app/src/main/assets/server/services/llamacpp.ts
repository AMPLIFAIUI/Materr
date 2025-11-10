/**
 * LlamaCPP Service - Interface to local Python Llama service
 * Connects to the local llama_service.py Flask server
 */

import fetch from 'node-fetch';

const LLAMA_SERVICE_URL = 'http://localhost:8080';

export interface LlamaResponse {
  text: string;
  tokens_used?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Check if the Llama service is running and healthy
 */
export async function checkLlamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LLAMA_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      return data.status === 'healthy' && data.model_loaded === true;
    }
    
    return false;
  } catch (error) {
    console.error('Llama health check failed:', error);
    return false;
  }
}

/**
 * Generate text using the local Llama model
 */
export async function generateLlamaResponse(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<LlamaResponse> {
  try {
    const response = await fetch(`${LLAMA_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Llama service error: ${response.status} - ${errorData}`);
    }

    const data = await response.json() as LlamaResponse;
    return data;
  } catch (error) {
    console.error('Llama generation failed:', error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Chat completions using the local Llama model (OpenAI-compatible format)
 */
export async function generateLlamaChatCompletion(
  messages: ChatMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  try {
    const response = await fetch(`${LLAMA_SERVICE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Llama chat completion error: ${response.status} - ${errorData}`);
    }

    const data = await response.json() as any;
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No response generated');
  } catch (error) {
    console.error('Llama chat completion failed:', error);
    throw new Error(`Failed to generate chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the Llama service with a simple prompt
 */
export async function testLlamaService(): Promise<boolean> {
  try {
    const isHealthy = await checkLlamaHealth();
    if (!isHealthy) {
      console.log('Llama service is not healthy');
      return false;
    }

    const response = await generateLlamaResponse(
      'Hello! This is a test. Please respond briefly.',
      { maxTokens: 50, temperature: 0.5 }
    );

    console.log('Llama test response:', response.text);
    return true;
  } catch (error) {
    console.error('Llama service test failed:', error);
    return false;
  }
}
