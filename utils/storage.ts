import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  ONBOARDING_COMPLETED: '@onboarding_completed',
  USER_PROFILE: '@user_profile',
  USERNAME: '@username',
  AVATAR_URI: '@avatar_uri',
  THEME_PREFERENCE: '@theme_preference',
};

// Onboarding
export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

export const getOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error loading onboarding status:', error);
    return false;
  }
};

// User Profile
export interface UserProfile {
  username: string;
  email: string;
  avatarUri?: string;
}

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return value ? JSON.parse(value) : {
      username: 'John Doe',
      email: 'john.doe@example.com',
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    return {
      username: 'John Doe',
      email: 'john.doe@example.com',
    };
  }
};

// Username
export const setUsername = async (username: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USERNAME, username);
  } catch (error) {
    console.error('Error saving username:', error);
  }
};

export const getUsername = async (): Promise<string> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.USERNAME);
    return value || 'John Doe';
  } catch (error) {
    console.error('Error loading username:', error);
    return 'John Doe';
  }
};

// Avatar
export const setAvatarUri = async (uri: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.AVATAR_URI, uri);
  } catch (error) {
    console.error('Error saving avatar URI:', error);
  }
};

export const getAvatarUri = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.AVATAR_URI);
  } catch (error) {
    console.error('Error loading avatar URI:', error);
    return null;
  }
};

// Clear all data
export const clearUserData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Chat Persistence
import { Conversation, Message } from '@/types';

// Add new keys
const KEY_PREFIXES = {
  CHAT: '@chat_',
  CONVERSATIONS: '@conversations',
};

export const saveChatMessages = async (conversationId: string, messages: Message[]): Promise<void> => {
  try {
    if (messages.length === 0) return;
    
    // Save messages
    await AsyncStorage.setItem(`${KEY_PREFIXES.CHAT}${conversationId}`, JSON.stringify(messages));
    
    // Update conversation list preview
    const lastMsg = messages[messages.length - 1];
    await updateConversationPreview(conversationId, lastMsg);
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
};

export const getChatMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const value = await AsyncStorage.getItem(`${KEY_PREFIXES.CHAT}${conversationId}`);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
};

// Conversations Management
export const getSavedConversations = async (): Promise<Conversation[] | null> => {
  try {
    const value = await AsyncStorage.getItem(KEY_PREFIXES.CONVERSATIONS);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading conversations:', error);
    return null;
  }
};

export const saveConversations = async (conversations: Conversation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY_PREFIXES.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

const updateConversationPreview = async (id: string, lastMessage: Message) => {
  try {
    const savedConvos = await getSavedConversations();
    if (!savedConvos) return;
    
    const updatedConvos = savedConvos.map(c => {
      if (c.id === id) {
        return {
          ...c,
          lastMessage: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
          timestamp: lastMessage.timestamp,
        };
      }
      return c;
    });
    
    await saveConversations(updatedConvos);
  } catch (error) {
    console.error('Error updating conversation preview:', error);
  }
};
