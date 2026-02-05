export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unread?: number;
  isPinned?: boolean;
  topic?: 'general' | 'coding' | 'image' | 'translate' | 'other';
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
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
