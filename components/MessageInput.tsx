import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';

interface MessageInputProps {
  onSend: (message: string, imageUri?: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const { colors, isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scale = useSharedValue(1);
  
  const handleSend = () => {
    if (message.trim() || selectedImage) {
      scale.value = withSequence(
        withSpring(0.9, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      
      onSend(message.trim(), selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
    }
  };
  
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = `data:image/jpeg;base64,${asset.base64}`;
      setSelectedImage(base64);
    }
  };
  
  const handleKeyPress = (e: any) => {
    // On web: Enter (without Shift) sends message
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <View style={styles.container}>
      <View style={[styles.glassWrapper, { borderColor: colors.glassBorder }]}>
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.removeImage}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Image Picker Button */}
        <TouchableOpacity onPress={handlePickImage} style={styles.attachButton}>
          <Ionicons name="image" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { color: colors.text, outlineStyle: 'none' } as any]}
          placeholder="Type futuristic message..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          onKeyPress={handleKeyPress}
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
            disabled={!message.trim() && !selectedImage}
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
  } as any, // Allow web-specific styles
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
  imagePreview: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 4,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 8,
    padding: 4,
  },
});
