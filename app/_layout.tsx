import SplashScreen from '@/components/SplashScreen';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { getOnboardingCompleted } from '@/utils/storage';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold
} from '@expo-google-fonts/poppins';
import {
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold
} from '@expo-google-fonts/sora';
import * as Font from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

function RootLayoutContent() {
  const { colorScheme } = useTheme();
  // Initially false to bypass splash (DEBUG)
  const [showSplash, setShowSplash] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    prepare();
    
    // Global safety net: Force ready after 5 seconds
    const safetyTimer = setTimeout(() => {
      console.log('⚠️ Safety timer triggered: Forcing app ready');
      setFontsLoaded(true);
      setIsReady(true);
    }, 5000);
    
    return () => clearTimeout(safetyTimer);
  }, []);

  // Transition from splash to app when everything is ready
  useEffect(() => {
    if (isReady && fontsLoaded && splashAnimationFinished) {
      if (needsOnboarding) {
        router.replace('/onboarding');
      }
      setShowSplash(false);
    }
  }, [isReady, fontsLoaded, splashAnimationFinished, needsOnboarding]);

  const prepare = async () => {
    try {
      // Load Onboarding status
      const completed = await getOnboardingCompleted();
      setNeedsOnboarding(!completed);

      // Load Fonts
      // Load Fonts with timeout
      await Promise.race([
        Font.loadAsync({
          'Sora-Regular': Sora_400Regular,
          'Sora-SemiBold': Sora_600SemiBold,
          'Sora-Bold': Sora_700Bold,
          'Poppins-Regular': Poppins_400Regular,
          'Poppins-Medium': Poppins_500Medium,
          'Poppins-SemiBold': Poppins_600SemiBold,
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3s fallback
      ]);
    } catch (e) {
      console.warn('Font Load Error:', e);
    } finally {
      setFontsLoaded(true);
      setIsReady(true);
    }
  };

  const handleSplashFinish = useCallback(() => {
    setSplashAnimationFinished(true);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding"
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: true,
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="chat/new" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
