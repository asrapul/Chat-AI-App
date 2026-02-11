export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unread?: number;
  isPinned?: boolean;
  topic?: 'general' | 'coding' | 'image' | 'translate' | 'other';
  type?: 'local' | 'supabase'; // Distinguish between local AI chat and Supabase chat
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string | null;
  timestamp: string;
  imageUrl?: string; // For image generation
}

export interface ProfileMenuItem {
  id: string;
  title: string;
  icon: string;
  iconFamily?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome';
  onPress?: () => void;
}

export interface ChatData {
  [conversationId: string]: Message[];
}
