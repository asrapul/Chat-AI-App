import { SCALE, SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Conversation } from '@/types';
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
  index?: number;
}

export default function ConversationItem({ conversation, onPress, index = 0 }: ConversationItemProps) {
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
  
  // No complex animations for list items - instant load like standard messengers
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {conversation.avatar && (conversation.avatar.startsWith('http') || conversation.avatar.startsWith('file') || conversation.avatar.startsWith('data')) ? (
          <Avatar imageUri={conversation.avatar} size="medium" />
        ) : (
          <Avatar icon={conversation.avatar} size="medium" />
        )}
        
        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {conversation.title}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {conversation.timestamp}
            </Text>
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
  preview: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
