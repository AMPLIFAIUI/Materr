import { useState, useEffect } from 'react';
import LlamaChat from '../plugins/llamaChat';
import { Capacitor } from '@capacitor/core';

export function useLocalAI() {
  const nativePlatform = Capacitor.isNativePlatform();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAI = async () => {
    if (!nativePlatform) {
      setIsInitialized(false);
      setError('Local AI requires a native runtime and is unavailable on the web');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await LlamaChat.initializeModel();

      if (result.success) {
        setIsInitialized(true);
        setError(null);
      } else {
        setIsInitialized(false);
        setError(result.message || 'Unable to initialize the local AI model');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize AI model';
      setIsInitialized(false);
      setError(message);
      console.error('AI initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string): Promise<string> => {
    if (!nativePlatform) {
      throw new Error(error || 'Local AI is not supported on this platform');
    }

    if (!isInitialized) {
      throw new Error(error || 'AI model not initialized');
    }

    try {
      setIsLoading(true);
      const result = await LlamaChat.sendMessage({ message });

      if (result.success && result.response) {
        setError(null);
        return result.response;
      }

      const failureMessage = result.message || 'Failed to get AI response';
      setError(failureMessage);
      throw new Error(failureMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message to AI';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    hasNativeRuntime: nativePlatform,
    sendMessage,
    initializeAI,
  };
}
