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

// Clear all conversations and chat messages only
export const clearAllConversations = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // Filter keys that are conversations or chat messages
    const chatKeys = keys.filter(key => 
      key.startsWith('@chat_') || key === '@conversations'
    );
    await AsyncStorage.multiRemove(chatKeys);
    console.log('✅ Cleared all conversations:', chatKeys.length, 'items');
  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
};

// Image Gallery Storage
export interface GeneratedImage {
  id: string;
  uri: string;           // base64 data URL
  prompt: string;
  timestamp: string;
  model?: string;
}

export const saveImageToGallery = async (image: GeneratedImage): Promise<void> => {
  try {
    const saved = await getGalleryImages();
    const updated = [image, ...saved];
    await AsyncStorage.setItem('@gallery_images', JSON.stringify(updated));
    console.log('✅ Image saved to gallery:', image.id);
  } catch (error) {
    console.error('Error saving image to gallery:', error);
  }
};

export const getGalleryImages = async (): Promise<GeneratedImage[]> => {
  try {
    const value = await AsyncStorage.getItem('@gallery_images');
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error loading gallery images:', error);
    return [];
  }
};

export const clearGalleryImages = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@gallery_images');
    console.log('✅ Gallery images cleared');
  } catch (error) {
    console.error('Error clearing gallery images:', error);
  }
};

export const deleteMultipleGalleryImages = async (ids: string[]): Promise<void> => {
  try {
    const saved = await getGalleryImages();
    const updated = saved.filter(img => !ids.includes(img.id));
    await AsyncStorage.setItem('@gallery_images', JSON.stringify(updated));
    console.log(`🗑️ [Gallery] Deleted ${ids.length} images success`);
  } catch (error) {
    console.error('Error deleting multiple gallery images:', error);
  }
};

// Chat Persistence
import { Conversation, Message } from '@/types';

// Add new keys
const KEY_PREFIXES = {
  CHAT: '@chat_',
  CONVERSATIONS: '@conversations',
};

// ... imports ...

// Helper to check if JSON is legacy array or new object
const parseChatFile = (json: string): { messages: Message[], meta: any } => {
  const parsed = JSON.parse(json);
  if (Array.isArray(parsed)) {
    return { messages: parsed, meta: {} };
  }
  return parsed;
};

export const saveChatMessages = async (conversationId: string, messages: Message[], topic?: string): Promise<void> => {
  try {
    if (messages.length === 0) return;
    
    // Get existing meta if any
    let meta = { isPinned: false, topic: topic || 'general' };
    try {
      const existing = await AsyncStorage.getItem(`${KEY_PREFIXES.CHAT}${conversationId}`);
      if (existing) {
        const parsed = parseChatFile(existing);
        meta = { ...parsed.meta, ...(topic ? { topic } : {}) };
      }
    } catch (e) {}

    // Save with metadata
    const data = { messages, meta };
    await AsyncStorage.setItem(`${KEY_PREFIXES.CHAT}${conversationId}`, JSON.stringify(data));
    
    // Update conversation list preview
    const lastMsg = messages[messages.length - 1];
    await updateConversationPreview(conversationId, lastMsg, meta);
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
};

export const getChatMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const value = await AsyncStorage.getItem(`${KEY_PREFIXES.CHAT}${conversationId}`);
    if (!value) return [];
    
    const parsed = parseChatFile(value);
    return parsed.messages;
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

const updateConversationPreview = async (id: string, lastMessage: Message, meta?: any) => {
  try {
    const savedConvos = await getSavedConversations();
    if (!savedConvos) return;
    
    const updatedConvos = savedConvos.map(c => {
      if (c.id === id) {
        return {
          ...c,
          lastMessage: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
          timestamp: lastMessage.timestamp,
          topic: meta?.topic || c.topic,
          isPinned: meta?.isPinned ?? c.isPinned,
        };
      }
      return c;
    });
    
    await saveConversations(updatedConvos);
  } catch (error) {
    console.error('Error updating conversation preview:', error);
  }
};

export const deleteConversation = async (id: string): Promise<void> => {
  try {
    // 1. Remove from index
    const savedConvos = await getSavedConversations() || [];
    const updatedConvos = savedConvos.filter(c => c.id !== id);
    await saveConversations(updatedConvos);
    
    // 2. Remove file
    await AsyncStorage.removeItem(`${KEY_PREFIXES.CHAT}${id}`);
    console.log(`🗑️ [Storage] Deleted conversation success: ${id}`);
    
    // Verify removal (debug log)
    const checkIndex = await getSavedConversations();
    console.log(`📊 [Storage] Remaining index count: ${checkIndex?.length || 0}`);
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
};

export const togglePinConversation = async (id: string): Promise<void> => {
  try {
    const savedConvos = await getSavedConversations() || [];
    const target = savedConvos.find(c => c.id === id);
    if (!target) return;
    
    const newStatus = !target.isPinned;
    
    // Update index
    const updatedConvos = savedConvos.map(c => (c.id === id ? { ...c, isPinned: newStatus } : c));
    await saveConversations(updatedConvos);
    
    // Update file metadata
    try {
      const chatKey = `${KEY_PREFIXES.CHAT}${id}`;
      const json = await AsyncStorage.getItem(chatKey);
      if (json) {
        const { messages, meta } = parseChatFile(json);
        await AsyncStorage.setItem(chatKey, JSON.stringify({
          messages,
          meta: { ...meta, isPinned: newStatus }
        }));
      }
    } catch (e) {}
    
    console.log(`✅ Toggled pin for ${id}: ${newStatus}`);
  } catch (error) {
    console.error('Error toggling pin:', error);
  }
};

// Bulk Operations
export const deleteMultipleConversations = async (ids: string[]): Promise<void> => {
  try {
    // 1. Update index once
    const savedConvos = await getSavedConversations() || [];
    const updatedConvos = savedConvos.filter(c => !ids.includes(c.id));
    await saveConversations(updatedConvos);
    
    // 2. Remove files in parallel
    const removePromises = ids.map(id => AsyncStorage.removeItem(`${KEY_PREFIXES.CHAT}${id}`));
    await Promise.all(removePromises);
    
    console.log(`🗑️ [Storage] Deleted ${ids.length} conversations success`);
    
    // Verify removal (debug log)
    const checkIndex = await getSavedConversations();
    console.log(`📊 [Storage] Remaining index count: ${checkIndex?.length || 0}`);
  } catch (error) {
    console.error('Error deleting multiple conversations:', error);
  }
};

export const bulkTogglePinConversations = async (ids: string[]): Promise<void> => {
  try {
    const savedConvos = await getSavedConversations() || [];
    if (savedConvos.length === 0) return;

    // Check if at least one selected is NOT pinned. If so, pin all.
    // If all selected are pinned, unpin all. (Common toggle logic)
    const selectedConvos = savedConvos.filter(c => ids.includes(c.id));
    const anyUnpinned = selectedConvos.some(c => !c.isPinned);
    const newStatus = anyUnpinned;

    // Update index
    const updatedConvos = savedConvos.map(c => 
      ids.includes(c.id) ? { ...c, isPinned: newStatus } : c
    );
    await saveConversations(updatedConvos);

    // Update individual chat metadata files in parallel
    const updatePromises = ids.map(async (id) => {
      try {
        const chatKey = `${KEY_PREFIXES.CHAT}${id}`;
        const json = await AsyncStorage.getItem(chatKey);
        if (json) {
          const { messages, meta } = parseChatFile(json);
          await AsyncStorage.setItem(chatKey, JSON.stringify({
            messages,
            meta: { ...meta, isPinned: newStatus }
          }));
        }
      } catch (e) {}
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Bulk toggled pin for ${ids.length} items to ${newStatus}`);
  } catch (error) {
    console.error('Error bulk pinning conversations:', error);
  }
};

// 🛠️ REPAIR UTILITY: Rebuild index from chat files
export const rebuildConversationIndex = async (): Promise<Conversation[]> => {
  try {
    console.log('🔧 Starting conversation index repair...');
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter(k => k.startsWith(KEY_PREFIXES.CHAT));
    
    const repairedConversations: Conversation[] = [];
    
    for (const key of chatKeys) {
      try {
        const id = key.replace(KEY_PREFIXES.CHAT, '');
        const json = await AsyncStorage.getItem(key);
        if (!json) continue;
        
        const { messages, meta } = parseChatFile(json);
        if (messages.length === 0) continue;
        
        const lastMsg = messages[messages.length - 1];
        const firstMsg = messages[0];
        
        const title = firstMsg.text.substring(0, 40) + (firstMsg.text.length > 40 ? '...' : '');
        
        repairedConversations.push({
          id,
          title: title || 'New Conversation',
          lastMessage: lastMsg.text.substring(0, 50) + (lastMsg.text.length > 50 ? '...' : ''),
          timestamp: lastMsg.timestamp,
          avatar: meta?.topic === 'image-gen' ? 'ImageIcon' : 'chatbubbles', // Simple inference or default
          isPinned: meta?.isPinned || false,
          topic: meta?.topic,
        });
      } catch (err) {
        console.warn('Skipping corrupted chat file:', key);
      }
    }
    
    // Sort: Pinned first, then newest
    repairedConversations.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    console.log(`✅ Repaired index with ${repairedConversations.length} conversations.`);
    await saveConversations(repairedConversations);
    return repairedConversations;
  } catch (error) {
    console.error('❌ Error repairing conversation index:', error);
    return [];
  }
};

export const syncAndRepairConversations = async (): Promise<Conversation[]> => {
  // ... (keep logic but verify it uses rebuildConversationIndex)
  try {
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter(k => k.startsWith(KEY_PREFIXES.CHAT));
    const savedConvos = await getSavedConversations() || [];

    if (savedConvos.length !== chatKeys.length) {
        return await rebuildConversationIndex();
    }
    // Just sort in case (Pinned first)
    savedConvos.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return savedConvos;
  } catch (error) {
    return [];
  }
};
