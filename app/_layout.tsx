import SplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
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
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

const isWeb = Platform.OS === 'web';

function RootLayoutContent() {
  const { colorScheme, colors } = useTheme();
  const { session, loading: authLoading, isOnboardingCompleted } = useAuth();
  // Skip splash on web — BlurView/Reanimated don't render properly
  const [showSplash, setShowSplash] = useState(!isWeb);
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(isWeb);

  useEffect(() => {
    prepare();
    
    // Global safety net: Force ready after 3 seconds
    const safetyTimer = setTimeout(() => {
      console.log('⚠️ Safety timer triggered: Forcing app ready');
      setFontsLoaded(true);
      setIsReady(true);
      setSplashAnimationFinished(true);
      setShowSplash(false);
    }, 3000);
    
    return () => clearTimeout(safetyTimer);
  }, []);

  // Handle auth-based routing
  useEffect(() => {
    if (authLoading || !isReady || !fontsLoaded) return;

    if (!session) {
      // Not logged in → show auth screen
      router.replace('/auth/login');
    }
  }, [session, authLoading, isReady, fontsLoaded]);

  // Transition from splash to app when everything is ready
  useEffect(() => {
    if (isReady && fontsLoaded && splashAnimationFinished) {
      if (!isOnboardingCompleted && session) {
        router.replace('/onboarding');
      }
      setShowSplash(false);
    }
  }, [isReady, fontsLoaded, splashAnimationFinished, isOnboardingCompleted, session]);

  const prepare = async () => {
    try {
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
      
      // Setup notification handling
      const { addNotificationResponseReceivedListener } = await import('@/utils/notifications');
      addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        if (data.type === 'digest') {
          router.replace('/(tabs)/digest');
        }
      });
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
        {/* Auth screens (shown when not logged in) */}
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />

        {/* Main app screens (shown when logged in) */}
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
        <Stack.Screen 
          name="digest/history" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="digest/[id]" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="digest/settings" 
          options={{ 
            headerShown: false,
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
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
