import { ChatData, Conversation } from '@/types';

export const conversations: Conversation[] = [
  {
    id: 'gpt-5-2',
    title: 'GPT-5.2',
    lastMessage: 'Ready for complex reasoning and programming tasks.',
    timestamp: new Date().toISOString(),
    avatar: 'logo-openai',
    unread: 1,
  },
  {
    id: 'gemini-3-pro',
    title: 'Gemini 3 Pro',
    lastMessage: 'Handling massive context and multimodal tasks.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    avatar: 'sparkles',
  },
  {
    id: 'claude-sonnet-4-5',
    title: 'Claude Sonnet 4.5',
    lastMessage: 'State-of-the-art reasoning and long-form text.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    avatar: 'document-text',
  },
  {
    id: 'grok-4-1',
    title: 'Grok 4.1',
    lastMessage: 'Leading the benchmark independent charts.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    avatar: 'flash',
  },
  {
    id: 'deepseek-v3-2',
    title: 'DeepSeek V3.2',
    lastMessage: 'Master of resonance and logical problem-solving.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    avatar: 'infinite',
  },
  {
    id: 'perplexity',
    title: 'Perplexity Search',
    lastMessage: 'Searching for the latest information...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    avatar: 'search',
  },
];

export const chatData: ChatData = {
  'gpt-5-2': [
    {
      id: 'gpt-1',
      text: 'Hello! I am GPT-5.2. How can I assist you with your complex knowledge or programming tasks today?',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    },
  ],
  'gemini-3-pro': [
    {
      id: 'gem-1',
      text: 'I am Gemini 3 Pro. My context window is massive. What shall we analyze today?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  'claude-sonnet-4-5': [
    {
      id: 'claude-1',
      text: 'Claude Sonnet 4.5 at your service. I excel in reasoning and generating long-form content.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ],
  'grok-4-1': [
    {
      id: 'grok-1',
      text: 'Grok 4.1 here. Benchmarks don\'t lie, I\'m faster and more accurate than ever.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
  'deepseek-v3-2': [
    {
      id: 'ds-1',
      text: 'DeepSeek V3.2 initialized. Ready to tackle your most difficult logical challenges.',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  'perplexity': [
    {
      id: 'perp-1',
      text: 'Perplexity Search mode active. I can browse and synthesize information for you. What are you looking for?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
};
