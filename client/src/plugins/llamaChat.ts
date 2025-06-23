import { registerPlugin } from '@capacitor/core';

export interface LlamaChatPlugin {
  initializeModel(): Promise<{ success: boolean; modelPath?: string; message: string }>;
  sendMessage(options: { message: string }): Promise<{ success: boolean; response?: string; message?: string }>;
}

const LlamaChat = registerPlugin<LlamaChatPlugin>('LlamaChat');

export default LlamaChat;
