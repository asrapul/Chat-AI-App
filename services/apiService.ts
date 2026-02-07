import { API_CONFIG, API_ENDPOINTS } from '@/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  modelId?: string;
  systemInstruction?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  modelId?: string;
  timestamp: string;
  imageUrl?: string;           // For image generation
  isImageGeneration?: boolean; // Flag for image gen
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  geminiConnected: boolean;
}

/**
 * API Service for communicating with backend server
 */
export const apiService = {
  /**
   * Bonus: Custom System Prompt persistence
   */
  getSystemPrompt: async () => {
    try {
      return await AsyncStorage.getItem('custom_system_prompt') || '';
    } catch (e) {
      return '';
    }
  },

  saveSystemPrompt: async (prompt: string) => {
    try {
      await AsyncStorage.setItem('custom_system_prompt', prompt);
    } catch (e) {}
  },

  /**
   * Check if backend server is healthy
   */
  healthCheck: async (): Promise<HealthResponse> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.HEALTH}`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
    }
  },

  /**
   * Send message to AI backend
   */
  sendMessage: async (
    message: string,
    history: ChatMessage[] = [],
    modelId?: string,
    conversationId?: string,
    topic?: string,
    imageUri?: string
  ): Promise<ChatResponse> => {
    try {
      const customPrompt = await apiService.getSystemPrompt();
      const requestBody = {
        message,
        history,
        modelId,
        conversationId,
        topic,
        imageUri,
        systemInstruction: customPrompt || undefined,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw new Error(error.message || 'Terjadi kesalahan saat memproses pesan Anda.');
    }
  },

  /**
   * Bonus: Streaming Support
   */
  sendMessageStream: async (
    message: string,
    onChunk: (data: { text?: string; imageUrl?: string; isImageGeneration?: boolean; error?: string }) => void,
    imageUri?: string
  ): Promise<string> => {
    try {
      const customPrompt = await apiService.getSystemPrompt();
      const requestBody = {
        message,
        imageUri,
        systemInstruction: customPrompt || undefined,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      let fullText = '';
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        
        const lines = lineBuffer.split('\n');
        // Keep the last partial line in the buffer
        lineBuffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              if (lineBuffer.length > 5000) {
                console.log(`📦 Large line buffer: ${lineBuffer.length} chars`);
              }
              const parsed = JSON.parse(dataStr);
              console.log('📡 SSE Parsed Chunk:', !!parsed.text, !!parsed.imageUrl);
              if (parsed.text !== undefined) {
                fullText += parsed.text;
                onChunk({ ...parsed, text: fullText });
              } else if (parsed.imageUrl || parsed.error) {
                onChunk(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data chunk. Buffer length:', trimmedLine.length);
              console.warn('Error:', e);
            }
          }
        }
      }
      return fullText;
    } catch (error: any) {
      console.error('Streaming API Error:', error);
      throw error;
    }
  },
};
