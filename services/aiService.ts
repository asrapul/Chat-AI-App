import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// NOTE: In production, use keys from environment variables
const API_KEY = "AIzaSyAe8DAbq5_Z_Yc2YVY1A8Y1RPnuJrwGjng";
const genAI = new GoogleGenerativeAI(API_KEY);

const systemInstructions: Record<string, string> = {
  'gpt-5-2': "You are GPT-5.2, the latest flagship model from OpenAI. You are professional, precise, and have superior capabilities in programming and complex logic. Always be helpful and direct.",
  'gemini-3-pro': "You are Gemini 3 Pro, Google's most advanced multimodal model. You have a massive context window and are excellent at cross-referencing information and multimodal reasoning.",
  'claude-sonnet-4-5': "You are Claude Sonnet 4.5, developed by Anthropic. You are known for your high level of reasoning, nuanced understanding of human instructions, and exceptional long-form writing skills.",
  'grok-4-1': "You are Grok 4.1, the latest xAI model. You are direct, fast, and pride yourself on being the top of independent benchmarks and having real-time knowledge integration.",
  'deepseek-v3-2': "You are DeepSeek V3.2. You are highly analytical and specialize in mathematical reasoning, coding, and solving the world's most difficult logical problems.",
  'perplexity': "You are Perplexity Search mode. You act as an information discovery engine. Your goal is to provide accurate, up-to-date information by synthesizing multiple sources. Always try to be factual and structured in your responses.",
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const aiService = {
  // Get chat model
  getModel: (modelId?: string) => {
    const instruction = modelId ? systemInstructions[modelId] : undefined;
    return genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Use flash for speed, or pro for better reasoning
      systemInstruction: instruction,
    });
  },

  // Send message and get response
  sendMessage: async (history: ChatMessage[], messageTokens: string, modelId?: string) => {
    try {
      const model = aiService.getModel(modelId);
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(messageTokens);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  },

  // Stream response (advanced)
  sendMessageStream: async (history: ChatMessage[], messageTokens: string) => {
    const model = aiService.getModel();
    const chat = model.startChat({
      history: history,
    });

    try {
      const result = await chat.sendMessageStream(messageTokens);
      return result.stream;
    } catch (error) {
       console.error("AI Stream Error:", error);
       throw error;
    }
  }
};
