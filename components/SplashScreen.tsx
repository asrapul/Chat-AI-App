import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const EnergyBlob = ({ delay, color }: { delay: number; color: string }) => {
  const tx = useSharedValue(Math.random() * width - width / 2);
  const ty = useSharedValue(Math.random() * height - height / 2);
  const scale = useSharedValue(0.8 + Math.random() * 0.5);

  useEffect(() => {
    tx.value = withRepeat(
      withTiming(Math.random() * width - width / 2, { duration: 5000 + Math.random() * 2000 }),
      -1,
      true
    );
    ty.value = withRepeat(
      withTiming(Math.random() * height - height / 2, { duration: 5000 + Math.random() * 2000 }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1 + Math.random(), { duration: 3000 + Math.random() * 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value }
    ],
    backgroundColor: color,
  }));

  return <Animated.View style={[styles.blob, animatedStyle]} />;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors, isDark } = useTheme();
  
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const containerScale = useSharedValue(1);
  
  useEffect(() => {
    // Logo entrance
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    
    // Exit sequence
    const timer = setTimeout(() => {
      containerScale.value = withTiming(2.5, { duration: 800 });
      logoOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(onFinish, 750);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value }
    ],
    opacity: logoOpacity.value,
  }));

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: interpolate(containerScale.value, [1, 1.8], [1, 0], Extrapolate.CLAMP),
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Dynamic Background Removed for Plain Black */}
      <View style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.logoWrapper, mainAnimatedStyle]}>
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.glassContainer}>
          <Animated.View style={[styles.logoContent, logoAnimatedStyle]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <Ionicons name="chatbubbles" size={60} color="#FFFFFF" />
            </LinearGradient>
            
            <Text style={[styles.title, { color: colors.text }]}>Monox AI</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your Intelligent Companion</Text>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: height / 2 - 150,
    left: width / 2 - 150,
    opacity: 0.6,
  },
  logoWrapper: {
    width: width * 0.8,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: {
    ...Typography.header,
    fontSize: 32,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});
