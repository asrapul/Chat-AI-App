import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';

interface MessageInputProps {
  onSend: (message: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const { colors, isDark } = useTheme();
  const [message, setMessage] = useState('');
  const scale = useSharedValue(1);
  
  const handleSend = () => {
    if (message.trim()) {
      scale.value = withSequence(
        withSpring(0.9, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <View style={styles.container}>
      <View style={[styles.glassWrapper, { borderColor: colors.glassBorder }]}>
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Type futuristic message..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />
        
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: message.trim() ? colors.primary : 'rgba(255,255,255,0.05)',
              }
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={message.trim() ? '#FFFFFF' : colors.textLight} 
            />
            {message.trim() && (
              <View style={[styles.buttonGlow, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  glassWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: {
    ...Typography.body,
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    zIndex: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    zIndex: 2,
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    zIndex: -1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
