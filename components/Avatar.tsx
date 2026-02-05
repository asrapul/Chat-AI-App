import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  
  const renderIcon = () => {
    const iconName = (icon as any) || 'person';
    const color = colors.aiAvatarIcon;
    const iconProps = { width: iconSize, height: iconSize, fill: color };

    switch (iconName) {
      case 'ChatIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill={color}/>
          </Svg>
        );
      case 'ImageIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill={color}/>
          </Svg>
        );
      case 'VideoIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill={color}/>
          </Svg>
        );
      case 'AudioIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" fill={color}/>
          </Svg>
        );
      case 'CodeIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill={color}/>
          </Svg>
        );
      case 'AnalyticsIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill={color}/>
          </Svg>
        );
      default:
        return <Ionicons name={iconName} size={iconSize} color={color} />;
    }
  };
  
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
          {renderIcon()}
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
