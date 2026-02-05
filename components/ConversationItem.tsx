import { SCALE, SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Conversation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';
import Avatar from './Avatar';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  index?: number;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function ConversationItem({ 
  conversation, 
  onPress, 
  onLongPress, 
  onDelete, 
  index = 0,
  selectionMode = false,
  isSelected = false,
  onSelect
}: ConversationItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    const delay = index * 100; // Stagger animation
    opacity.value = withDelay(delay, withSpring(1, SPRING_CONFIG.SMOOTH));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG.SMOOTH));
  }, [index]);
  
  const handlePressIn = () => {
    scale.value = withSpring(SCALE.PRESS, SPRING_CONFIG.SNAPPY);
  };
  
  const handleDelete = (e: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (onDelete) {
      onDelete();
    }
  };
  
  // No complex animations for list items - instant load like standard messengers
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </View>
        )}
        
        {conversation.avatar && (conversation.avatar.startsWith('http') || conversation.avatar.startsWith('file') || conversation.avatar.startsWith('data')) ? (
          <Avatar imageUri={conversation.avatar} size="medium" />
        ) : (
          <Avatar icon={conversation.avatar} size="medium" />
        )}
        
        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {conversation.title}
              </Text>
            </View>
            <View style={styles.rightActions}>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {conversation.timestamp}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.preview, 
            { 
              color: conversation.unread ? colors.text : colors.textSecondary,
              fontFamily: conversation.unread ? Typography.bodySemiBold.fontFamily : Typography.body.fontFamily 
            }
          ]} numberOfLines={2}>
            {conversation.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...Typography.subHeader,
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    ...Typography.body,
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  preview: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  selectionIndicator: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
