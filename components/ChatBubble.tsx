import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';

interface ChatBubbleProps {
  message: Message;
  index?: number;
  currentUserId?: string;
}

export default function ChatBubble({ message, index = 0, currentUserId }: ChatBubbleProps) {
  const { colors, isDark } = useTheme();
  
  // Logic for separation
  const isAI = message.sender === 'ai';
  const isMe = message.sender === 'user' && (message.senderId === currentUserId || !message.senderId && !message.senderName); 
  // If no senderId/Name, assume it's me (legacy behavior) or if IDs match.
  // Actually, for multi-user, we need to be strict. 
  // If senderId is present and != currentUserId, it's NOT ME.
  
  const isOtherUser = !isAI && !isMe;
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  
  useEffect(() => {
    const delay = index * 20; // Faster staggering
    opacity.value = withDelay(delay, withSpring(1, { damping: 20 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20 }));
  }, [index]);
  
  const handleSpeak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(message.text, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        rate: 1.0,
      });
    }
  };

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(message.text);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  const markdownStyles = StyleSheet.create({
    body: {
      ...Typography.body,
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    code_inline: {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 4,
      paddingHorizontal: 6,
      color: colors.text,
      fontFamily: 'monospace',
    },
    fence: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderColor: colors.glassBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginVertical: 10,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'none',
      fontWeight: '600',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 10,
    },
  });
  
  return (
    <Animated.View style={[
      styles.container, 
      isMe ? styles.userRow : styles.otherRow, 
      animatedStyle
    ]}>
      <View style={[styles.bubbleWrapper, isMe ? styles.userWrapper : styles.otherWrapper]}>
        
        {/* Show Name/Avatar for Other Users */}
        {isOtherUser && (
            <View style={styles.senderInfo}>
                <Image 
                    source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName || 'User')}&background=random` }} 
                    style={styles.senderAvatar}
                />
                <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                    {message.senderName || 'User'}
                </Text>
            </View>
        )}
        {isAI ? (
          <View style={[styles.aiBubbleContainer, { borderColor: colors.glassBorder }]}>
            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.aiContent}>
              <View style={styles.aiHeader}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.aiIconSmall}
                >
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.aiName, { color: colors.textSecondary }]}>Assistant</Text>
              </View>
              
              {/* Display generated image if present */}
              {message.imageUrl && (
                <>
                  {console.log('🖼️ ChatBubble rendering image:', message.imageUrl.substring(0, 50))}
                  <Image 
                    key={`img-${message.id}-${message.imageUrl.length}`} 
                    source={{ uri: message.imageUrl }} 
                    style={styles.generatedImage}
                    contentFit="cover"
                    transition={500}
                  />
                </>
              )}

              <Markdown style={markdownStyles}>
                {message.text}
              </Markdown>
              
              <View style={[styles.actionRow, { borderTopColor: colors.glassBorder }]}>
                <TouchableOpacity onPress={handleSpeak} style={styles.actionButton}>
                  <Ionicons 
                    name={isSpeaking ? "stop-circle" : "volume-high"} 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                  <Ionicons name="copy" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.userBubbleContainer, 
            !isMe && { 
                backgroundColor: isDark ? '#333' : '#f0f0f0',
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 24,
            }
          ]}>
            {isMe ? (
                <LinearGradient
                  colors={colors.userBubble as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userGradient}
                >
                  {/* Display uploaded image if present */}
                  {message.imageUrl && (
                    <Image 
                      source={{ uri: message.imageUrl }} 
                      style={styles.userImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={[styles.userText, { color: colors.userBubbleText }]}>{message.text}</Text>
                </LinearGradient>
            ) : (
                <View style={styles.otherUserBubble}>
                   {message.imageUrl && (
                    <Image 
                      source={{ uri: message.imageUrl }} 
                      style={styles.userImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={[styles.userText, { color: colors.text }]}>{message.text}</Text>
                </View>
            )}
            
            {isMe && <View style={[styles.glow, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  aiRow: {
    alignItems: 'flex-start',
  },
  otherRow: {
    alignItems: 'flex-start',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  aiWrapper: {
    width: '100%',
  },
  otherWrapper: {
     alignItems: 'flex-start',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    ...Typography.caption,
    fontSize: 12,
  },
  aiBubbleContainer: {
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aiContent: {
    padding: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiName: {
    ...Typography.header,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userBubbleContainer: {
    borderRadius: 24,
    borderBottomRightRadius: 6,
    overflow: 'visible',
  },
  userGradient: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderBottomRightRadius: 6,
    zIndex: 1,
  },
  otherUserBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderBottomLeftRadius: 6,
  },
  userText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  glow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 20,
    zIndex: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    opacity: 0.4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionButton: {
    marginRight: 20,
    opacity: 0.8,
  },
  generatedImage: {
    width: '100%',
    aspectRatio: 1,
    minHeight: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  userImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
});
