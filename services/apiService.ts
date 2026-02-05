import { API_CONFIG, API_ENDPOINTS } from '@/constants/Config';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  modelId?: string;
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
      const requestBody = {
        message,
        history,
        modelId,
        conversationId,
        topic,
        imageUri,  // Include image data
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true', // Bypass LocalTunnel warning
          'User-Agent': 'Monox-Mobile-App', // Help identify as app
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
      
      // User-friendly error messages
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        throw new Error('Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.');
      }
      
      throw new Error(error.message || 'Terjadi kesalahan saat memproses pesan Anda.');
    }
  },
};
