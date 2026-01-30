import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface AvatarProps {
  icon?: string;
  imageUri?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function Avatar({ icon, imageUri, size = 'medium', style }: AvatarProps) {
  const { colors } = useTheme();
  // State to track if image failed to load
  const [imageError, setImageError] = React.useState(false);
  
  // Reset error state when uri changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUri]);
  
  const sizeMap = {
    small: 40,
    medium: 50,
    large: 80,
  };
  
  const iconSizeMap = {
    small: 20,
    medium: 24,
    large: 40,
  };
  
  const avatarSize = sizeMap[size];
  const iconSize = iconSizeMap[size];
  
  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {imageUri && !imageError ? (
        <Image 
          source={{ uri: imageUri }} 
          style={[styles.image, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} 
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.gradient, 
            { 
              width: avatarSize, 
              height: avatarSize, 
              borderRadius: avatarSize / 2,
              backgroundColor: colors.aiAvatarBackground 
            }
          ]}
        >
          <Ionicons 
            name={(icon as any) || 'person'} 
            size={iconSize} 
            color={colors.aiAvatarIcon} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});
