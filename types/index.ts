export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unread?: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: string;
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
