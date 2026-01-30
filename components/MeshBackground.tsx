import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export default function MeshBackground() {
  const { isDark } = useTheme();
  
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  
  useEffect(() => {
    // Animate orbs for mesh effect
    orb1X.value = withRepeat(withSequence(withTiming(100, { duration: 15000 }), withTiming(0, { duration: 15000 })), -1, true);
    orb1Y.value = withRepeat(withSequence(withTiming(200, { duration: 20000 }), withTiming(0, { duration: 20000 })), -1, true);
    
    orb2X.value = withRepeat(withSequence(withTiming(-100, { duration: 18000 }), withTiming(0, { duration: 18000 })), -1, true);
    orb2Y.value = withRepeat(withSequence(withTiming(-150, { duration: 22000 }), withTiming(0, { duration: 22000 })), -1, true);
  }, []);
  
  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));
  
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.background, { backgroundColor: isDark ? '#050505' : '#F0F2F5' }]} />
      
      {/* Animated Mesh Orbs */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
        <LinearGradient
          colors={isDark ? ['#7000FF44', '#7000FF00'] : ['#4FACFE33', '#4FACFE00']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
        <LinearGradient
          colors={isDark ? ['#00E6FF33', '#00E6FF00'] : ['#A29BFE33', '#A29BFE00']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Blur Overlay for "Cloudy" effect */}
      <BlurView intensity={isDark ? 80 : 40} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  orb1: {
    top: -100,
    left: -100,
  },
  orb2: {
    bottom: -150,
    right: -100,
  },
});
