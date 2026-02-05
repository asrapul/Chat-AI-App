import ChatBubble from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { chatData, conversations as mockConversations } from '@/data/mockData';
import { apiService } from '@/services/apiService';
import { Conversation, Message } from '@/types';
import { getChatMessages, getSavedConversations, saveChatMessages, saveConversations, saveImageToGallery } from '@/utils/storage';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatDetailScreen() {
  const { colors, isDark } = useTheme();
  const { id, model, topic, topicName, topicIcon } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  // Try to find in storage or mock
  const conversation = mockConversations.find(c => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const inputTranslateY = useSharedValue(50);
  const inputOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadMessages();
    
    // Simplier Input entrance animation
    inputTranslateY.value = withDelay(100, withSpring(0, { damping: 20 }));
    inputOpacity.value = withDelay(100, withSpring(1, { damping: 20 }));
  }, [id]);
  
  const loadMessages = async () => {
    setIsLoading(true);
    const savedMessages = await getChatMessages(id as string);
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // Fallback to mock data if empty
      setMessages(chatData[id as string] || []);
    }
    setIsLoading(false);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  };
  
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      saveChatMessages(id as string, messages, topic as string);
      
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
    
    const userMessage: Message = {
      id: `${id}-${Date.now()}-user`,
      text: text || (imageUri ? '📷 Image' : ''),
      sender: 'user',
      timestamp: new Date().toISOString(),
      imageUrl: imageUri,
    };
    
    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);      
      // Simulate typing
      setIsTyping(true);
    
    // Create conversation entry if this is first message
    if (messages.length === 0) {
      await createConversation(text);
    }
    
    try {
      // Convert history for API context
      const history = messages.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }]
      }));
      
      // Determine Model ID: use param if available, otherwise check if ID is a model ID, else default
      const modelIdToUse = (model as string) || (['gpt-5-2', 'gemini-3-pro', 'claude-sonnet-4-5', 'grok-4-1', 'deepseek-v3-2', 'perplexity'].includes(id as string) ? id : 'gpt-5-2');

      // Determine stream vs regular
      if (imageUri) {
        // Use regular for images (vision usually doesn't need stream as much and is simpler)
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

        const botMessage: Message = {
          id: Date.now().toString(),
          text: response.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          imageUrl: response.imageUrl,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        // STREAMING for text-only messages
        const botMsgId = Date.now().toString();
        
        // Initial empty bot message
        setMessages(prev => [...prev, {
          id: botMsgId,
          text: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
        }]);

        await apiService.sendMessageStream(
          text,
          (fullText: string) => {
            setMessages(prev => prev.map(m => 
              m.id === botMsgId ? { ...m, text: fullText } : m
            ));
          }
        );
      }

      
    } catch (error) {
      console.error('❌ Chat error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error connecting to the AI. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const createConversation = async (firstMessage: string) => {
    try {
      const savedConversations = await getSavedConversations() || [];
      
      // Check if conversation already exists
      if (savedConversations.some(c => c.id === id)) {
        return; // Already exists
      }
      
      // Map icon names to Ionicons names
      const iconMap: { [key: string]: string } = {
        'ChatIcon': 'chatbubbles',
        'ImageIcon': 'image',
        'VideoIcon': 'videocam',
        'AudioIcon': 'musical-notes',
        'CodeIcon': 'code-slash',
        'AnalyticsIcon': 'bar-chart',
      };
      
      // Generate title from first message (first 40 chars)
      let title = firstMessage.substring(0, 40);
      if (firstMessage.length > 40) {
        title += '...';
      }
      
      const newConversation: Conversation = {
        id: id as string,
        title: title, // Use first prompt as title
        lastMessage: firstMessage.substring(0, 60) + (firstMessage.length > 60 ? '...' : ''),
        timestamp: new Date().toISOString(),
        avatar: topicIcon as string || 'chatbubbles',
        unread: 0,
        topic: topic as any,
      };
      
      // Add to beginning of list (most recent first)
      const updatedConversations = [newConversation, ...savedConversations];
      await saveConversations(updatedConversations);
      
      console.log('✅ Created new conversation:', newConversation.title);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <Text style={{ ...Typography.subHeader, fontSize: 17, color: colors.text }}>
              {(topicName as string) || 'Monox AI'}
            </Text>
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
          renderItem={({ item, index }) => <ChatBubble message={item} index={index} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        <Animated.View style={inputAnimatedStyle}>
          <MessageInput onSend={handleSend} />
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
