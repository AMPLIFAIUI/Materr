import { useState, useEffect } from 'react';
import LlamaChat from '../plugins/llamaChat';
import { Capacitor } from '@capacitor/core';

export function useLocalAI() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Local AI only available on mobile devices');
      return;
    }

    try {
      setIsLoading(true);
      const result = await LlamaChat.initializeModel();
      
      if (result.success) {
        setIsInitialized(true);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to initialize AI model');
      console.error('AI initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('AI model not initialized');
    }

    try {
      setIsLoading(true);
      const result = await LlamaChat.sendMessage({ message });
      
      if (result.success && result.response) {
        return result.response;
      } else {
        throw new Error(result.message || 'Failed to get AI response');
      }
    } catch (err) {
      throw new Error('Failed to send message to AI');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    sendMessage,
    initializeAI
  };
}
