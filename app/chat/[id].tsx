import ChatBubble from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { apiService } from '@/services/apiService';
import { SupabaseMessage, supabaseService } from '@/services/supabaseService';
import { Message } from '@/types';
import { getChatMessages, saveChatMessages, saveImageToGallery } from '@/utils/storage';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Convert Supabase message to app Message type
const toAppMessage = (msg: SupabaseMessage): Message => ({
  id: msg.id,
  text: msg.content,
  sender: msg.sender_type === 'ai' ? 'ai' : 'user',
  senderId: msg.user_id,
  senderName: msg.profile?.username || 'User',
  senderAvatar: msg.profile?.avatar_url,
  timestamp: msg.created_at,
  imageUrl: msg.image_url || undefined,
});

export default function ChatDetailScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { id, model, topic, topicName, topicIcon, typeRef } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  // Determine if it's a local chat or Supabase chat
  // Default to Supabase for backward compatibility, or local if explicitly set
  const type = (typeRef as string) || (useLocalSearchParams().type as string) || 'supabase';
  const isLocal = type === 'local';
  
  // AI is active if topic is NOT 'general' (which is used for group/direct chats)
  // Ensure we don't treat undefined topic as AI
  const isAI = !!topic && topic !== 'general';

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Realtime hook - Skip if local
  const {
    realtimeMessages,
    typingUsers,
    onlineUsers,
    sendTyping: sendTypingEvent,
    trackPresence,
    clearRealtimeMessages,
  } = useRealtimeMessages(isLocal ? undefined : id as string);
  
  const inputTranslateY = useSharedValue(50);
  const inputOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadMessages();
    
    // Input entrance animation
    inputTranslateY.value = withDelay(100, withSpring(0, { damping: 20 }));
    inputOpacity.value = withDelay(100, withSpring(1, { damping: 20 }));

    // Track presence when entering room (only for Supabase)
    if (user && !isLocal) {
      trackPresence(user.id, user.email?.split('@')[0] || 'User');
    }

    // Reload messages when app comes to foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadMessages();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [id]);

  // Merge realtime messages (only for Supabase)
  useEffect(() => {
    if (!isLocal && realtimeMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = realtimeMessages
          .filter(m => !existingIds.has(m.id))
          .map(toAppMessage);
        
        if (newMsgs.length === 0) return prev;
        return [...prev, ...newMsgs];
      });
      clearRealtimeMessages();
    }
  }, [realtimeMessages, isLocal]);

  // Show typing from other users
  const otherTyping = typingUsers.filter(u => u.userId !== user?.id);
  
  const loadMessages = async () => {
    setIsLoading(true);
    
    if (isLocal) {
      const localMsgs = await getChatMessages(id as string);
      setMessages(localMsgs);
    } else {
      const supaMessages = await supabaseService.getMessages(id as string);
      if (supaMessages.length > 0) {
        setMessages(supaMessages.map(toAppMessage));
      }
    }

    setIsLoading(false);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  };
  
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);
  
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputTranslateY.value }],
    opacity: inputOpacity.value,
  }));
  
  const handleSend = async (text: string, imageUri?: string) => {
    if (!text.trim() && !imageUri) return;
    if (!user) return;
    
    // 1. Process User Message
    const userMsgId = isLocal ? Date.now().toString() : undefined;
    
    const newUserMsg: Message = {
      id: userMsgId || 'temp',
      text: text || (imageUri ? '📷 Image' : ''),
      sender: 'user',
      senderId: user.id,
      senderName: user.email?.split('@')[0] || 'User', // Optimistic name
      senderAvatar: undefined, // Optimistic avatar (we could fetch from context if available)
      timestamp: new Date().toISOString(),
      imageUrl: imageUri,
    };

    if (isLocal) {
      // Local: Update state immediately and save
      setMessages(prev => {
        const updated = [...prev, newUserMsg];
        saveChatMessages(id as string, updated, topic as string);
        return updated;
      });
    } else {
      // Supabase: Send to DB
      const savedMsg = await supabaseService.sendMessage(
        id as string,
        user.id,
        text || (imageUri ? '📷 Image' : ''),
        'user',
        imageUri
      );

      if (savedMsg) {
        // We get the real message back, but it might not have profile joined yet.
        // We can merge optimistic profile info or assume toAppMessage handles it if backend returns it
        // Actually Supabase insert returns just the row.
        // So we keep using the optimistic one but update ID?
        // Let's just update ID and keep our optimistic profile info.
        const userMessage = { ...newUserMsg, id: savedMsg.id };
        setMessages(prev => prev.map(m => m.id === 'temp' ? userMessage : m));
      }
    }
      
    // 2. AI Response Logic (Only if isAI is true)
    if (isAI) {
      setIsTyping(true);
      
      try {
        if (imageUri) {
          // Use regular for images
          const response = await apiService.sendMessage(
            text, 
            [], 
            model as string, 
            id as string, 
            topic as string,
            imageUri 
          );
  
          if (response.isImageGeneration && response.imageUrl) {
            await saveImageToGallery({
              id: `img-${Date.now()}`,
              uri: response.imageUrl,
              prompt: text,
              timestamp: new Date().toISOString(),
              model: model as string || 'monox-ai',
            });
          }
  
          // Check response
          const aiText = response.response;
          const aiImage = response.imageUrl;

          if (isLocal) {
            const newAiMsg: Message = {
              id: Date.now().toString() + '-ai',
              text: aiText,
              sender: 'ai',
              timestamp: new Date().toISOString(),
              imageUrl: aiImage,
            };
            
            setMessages(prev => {
              const updated = [...prev, newAiMsg];
              saveChatMessages(id as string, updated, topic as string);
              return updated;
            });
          } else {
            // Save AI response to Supabase
            const aiMsg = await supabaseService.sendMessage(
              id as string,
              user.id,
              aiText,
              'ai',
              aiImage
            );
    
            if (aiMsg) {
              setMessages(prev => [...prev, toAppMessage(aiMsg)]);
            }
          }

        } else {
          // STREAMING for text-only messages
          const botMsgId = isLocal ? (Date.now() + 1).toString() : `temp-${Date.now()}`;
          
          // Initial empty bot message
          setMessages(prev => [...prev, {
            id: botMsgId,
            text: '',
            sender: 'ai',
            timestamp: new Date().toISOString(),
          }]);
  
          const fullText = await apiService.sendMessageStream(
            text,
            async (data) => {
              if (data.isImageGeneration && data.imageUrl) {
                setMessages(prev => prev.map(m => 
                  m.id === botMsgId ? { 
                    ...m, 
                    text: data.text || m.text, 
                    imageUrl: data.imageUrl,
                  } : m
                ));
              } else if (data.text) {
                setMessages(prev => prev.map(m => 
                  m.id === botMsgId ? { ...m, text: data.text || '' } : m
                ));
              }
            },
            imageUri
          );

          // Final save after stream complete
          if (isLocal) {
             setMessages(prev => {
                // Determine final message state from prev
                const finalMsg = prev.find(m => m.id === botMsgId);
                if (finalMsg) {
                    // Update storage with final array
                    saveChatMessages(id as string, prev, topic as string);
                }
                return prev;
             });
          } else {
             // Supabase: Save the COMPLETE message to DB
             const aiMsg = await supabaseService.sendMessage(
                id as string, 
                user.id, 
                fullText, 
                'ai' 
             );
             
             // Update temp message with real ID
             if (aiMsg) {
                setMessages(prev => prev.map(m => 
                    m.id === botMsgId ? toAppMessage(aiMsg) : m
                ));
             }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message to chat
        const errorMsg: Message = {
            id: 'error-' + Date.now(),
            text: 'Sorry, I encountered an error. Please try again.',
            sender: 'ai',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => isLocal ? [...prev, errorMsg] : prev); // Only add to local state easily
        if(isLocal) saveChatMessages(id as string, [...messages, errorMsg], topic as string);
      } finally {
        setIsTyping(false);
      }
    } else {
        // Not AI -> Just finish
        setIsTyping(false);
    }
  };

  // Send typing indicator when user is composing
  const handleTypingStart = () => {
    if (user && !isLocal) {
      sendTypingEvent(user.id, user.email?.split('@')[0] || 'User', true);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <View>
              <Text style={{ ...Typography.subHeader, fontSize: 17, color: colors.text }}>
                {(topicName as string) || 'Monox AI'}
              </Text>
              {onlineUsers.length > 0 && !isLocal && (
                <Text style={{ ...Typography.caption, fontSize: 11, color: colors.primary }}>
                  {onlineUsers.length} online
                </Text>
              )}
            </View>
          ),
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          title: '', 
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ChatBubble 
                message={item} 
                index={index} 
                currentUserId={user?.id}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping || otherTyping.length > 0 ? (
              <TypingIndicator />
            ) : null
          }
        />

        <Animated.View style={inputAnimatedStyle}>
          <MessageInput onSend={handleSend} onTypingStart={handleTypingStart} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
