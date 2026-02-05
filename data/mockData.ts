import { ChatData, Conversation } from '@/types';

// No mock data - show only real conversations created by user
export const conversations: Conversation[] = [];

export const chatData: ChatData = {
  'language-models': [
    {
      id: 'llm-1',
      text: 'Hello! I\'m Monox AI. I\'m powered by advanced language models. How can I help you today?',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    },
  ],
  'image-generator': [
    {
      id: 'img-1',
      text: 'Ready to create! Describe the image you want to generate and I\'ll bring your vision to life.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
};
