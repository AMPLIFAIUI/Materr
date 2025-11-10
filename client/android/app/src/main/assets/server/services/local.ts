/**
 * Local AI Service - Orchestrates local AI responses using DeepSeek-R1 via Llama
 * This is the main service that routes requests to the local Llama model
 */

import { generateLlamaChatCompletion, checkLlamaHealth, testLlamaService } from './llamacpp.js';
import type { Specialist } from '@shared/schema';

export interface LocalAIResponse {
  content: string;
  reasoning?: string;
  error?: string;
}

/**
 * Generate AI response using local DeepSeek-R1 model
 */
export async function generateLocalResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  specialist?: Specialist,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<LocalAIResponse> {
  try {
    // Check if Llama service is available
    const isHealthy = await checkLlamaHealth();
    if (!isHealthy) {
      return {
        content: "I'm sorry, but I'm currently offline. Please check that the local AI service is running and try again.",
        error: "Local AI service unavailable"
      };
    }

    // Prepare messages with specialist context
    const systemPrompt = specialist 
      ? `You are ${specialist.name}, a ${specialist.specialty} specialist. ${specialist.description || ''} 
         Respond in character as this specialist, using appropriate professional knowledge and empathy.
         Keep responses conversational, supportive, and helpful. Use casual Australian slang where appropriate.`
      : `You are Mate, a friendly AI assistant focused on mental health support. 
         Provide supportive, empathetic, and helpful responses. Use casual Australian slang where appropriate.`;

    const contextualMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    // Generate response using local Llama model
    const response = await generateLlamaChatCompletion(
      contextualMessages,
      {
        maxTokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      }
    );

    return {
      content: response,
      reasoning: "Response generated using local DeepSeek-R1 model"
    };

  } catch (error) {
    console.error('Local AI generation failed:', error);
    
    return {
      content: "I'm having trouble processing your message right now. This might be because the local AI service isn't running properly. Please try again in a moment.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test the local AI service
 */
export async function testLocalAI(): Promise<boolean> {
  try {
    console.log('Testing local AI service...');
    
    const isServiceHealthy = await testLlamaService();
    if (!isServiceHealthy) {
      console.log('Llama service test failed');
      return false;
    }

    // Test a simple conversation
    const testResponse = await generateLocalResponse([
      { role: 'user', content: 'Hello, how are you?' }
    ]);

    if (testResponse.error) {
      console.log('Local AI test failed:', testResponse.error);
      return false;
    }

    console.log('Local AI test successful. Response:', testResponse.content);
    return true;

  } catch (error) {
    console.error('Local AI test error:', error);
    return false;
  }
}

/**
 * Check if local AI is available and ready
 */
export async function isLocalAIAvailable(): Promise<boolean> {
  return await checkLlamaHealth();
}

/**
 * Get status information about the local AI service
 */
export async function getLocalAIStatus(): Promise<{
  available: boolean;
  service: string;
  model: string;
  error?: string;
}> {
  try {
    const available = await isLocalAIAvailable();
    
    return {
      available,
      service: 'DeepSeek-R1 via Llama CPP',
      model: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_0',
      ...(available ? {} : { error: 'Local AI service not responding' })
    };
  } catch (error) {
    return {
      available: false,
      service: 'DeepSeek-R1 via Llama CPP',
      model: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
