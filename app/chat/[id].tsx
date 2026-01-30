import ChatBubble from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { chatData, conversations as mockConversations } from '@/data/mockData';
import { Message } from '@/types';
import { getChatMessages, saveChatMessages } from '@/utils/storage';
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
  const { id, model } = useLocalSearchParams();
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
      saveChatMessages(id as string, messages);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);
  
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputTranslateY.value }],
    opacity: inputOpacity.value,
  }));
  
  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: `${id}-${Date.now()}-user`,
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    
    try {
      // Convert history for AI context
      const history = messages.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }]
      }));
      
      // Determine Model ID: use param if available, otherwise check if ID is a model ID, else default
      const modelIdToUse = (model as string) || (['gpt-5-2', 'gemini-3-pro', 'claude-sonnet-4-5', 'grok-4-1', 'deepseek-v3-2', 'perplexity'].includes(id as string) ? id : 'gpt-5-2');

      // Get AI response
      await import('@/services/aiService').then(async ({ aiService }) => {
        const responseText = await aiService.sendMessage(history, text, modelIdToUse as string);
        
        const aiMessage: Message = {
          id: `${id}-${Date.now()}-ai`,
          text: responseText,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
      });
      
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: `${id}-${Date.now()}-error`,
        text: "Sorry, I encountered an error connecting to the AI. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <Text style={{ ...Typography.subHeader, fontSize: 17, color: colors.text }}>
              {conversation?.title || 'Chatbot AI'}
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
});
