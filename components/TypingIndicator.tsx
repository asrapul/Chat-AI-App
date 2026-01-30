import { useTheme } from '@/context/ThemeContext';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export default function TypingIndicator() {
  const { colors } = useTheme();
  
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  
  useEffect(() => {
    // Animate dots in sequence
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1
    );
    
    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1
      )
    );
    
    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1
      )
    );
  }, []);
  
  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ translateY: -dot1.value * 4 }],
  }));
  
  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ translateY: -dot2.value * 4 }],
  }));
  
  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ translateY: -dot3.value * 4 }],
  }));
  
  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: colors.cardBackground }]}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot1Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
