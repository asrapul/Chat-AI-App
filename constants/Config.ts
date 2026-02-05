// API Configuration
import { Platform } from 'react-native';

export const API_CONFIG = {
  // Development URLs for different platforms
  ANDROID_EMULATOR: 'http://10.0.2.2:3003',
  IOS_SIMULATOR: 'http://localhost:3003',
  PHYSICAL_DEVICE: 'http://192.168.1.13:3003', // Using fixed LAN IP
  
  // Production URL (will be set after deployment)
  PRODUCTION: 'https://your-app.railway.app',
  
  // Current environment
  BASE_URL: __DEV__ 
    ? (Platform.OS === 'web' ? 'http://localhost:3003' : 'http://192.168.1.13:3003') // Use LAN IP (Firewall fixed)
    : 'https://your-app.railway.app', // Production URL
};

export const API_ENDPOINTS = {
  HEALTH: '/',
  CHAT: '/api/chat',
};
