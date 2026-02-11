import Avatar from '@/components/Avatar';
import EditProfileModal from '@/components/EditProfileModal';
import ProfileMenuItem from '@/components/ProfileMenuItem';
import { SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/apiService';
import { supabaseService } from '@/services/supabaseService';
import { UserProfile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    username: 'User',
    email: '',
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  
  const avatarScale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadProfile();
    loadSystemPrompt();
    
    // Entrance animations
    avatarScale.value = withDelay(100, withSpring(1, SPRING_CONFIG.BOUNCY));
    headerOpacity.value = withDelay(200, withSpring(1, SPRING_CONFIG.SMOOTH));
  }, []);
  
  const loadProfile = async () => {
    if (!user) return;
    
    // Load from Supabase profile
    const supaProfile = await supabaseService.getProfile(user.id);
    
    setProfile({
      username: supaProfile?.username || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatarUri: supaProfile?.avatar_url || undefined,
    });
  };

  const loadSystemPrompt = async () => {
    const prompt = await apiService.getSystemPrompt();
    setSystemPrompt(prompt);
  };
  
  const handleSaveSystemPrompt = async (text: string) => {
    setSystemPrompt(text);
    await apiService.saveSystemPrompt(text);
  };
  
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));
  
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };
  
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    
    // Also update in Supabase
    if (user) {
      await supabaseService.updateProfile(user.id, {
        username: updatedProfile.username,
        avatar_url: updatedProfile.avatarUri || null,
      });
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const performSignOut = async () => {
      try {
        console.log('🔄 Logout: Initiating signOut...');
        await signOut();
        // Fallback for Web if the RootLayout doesn't redirect fast enough
        if (Platform.OS === 'web') {
          console.log('🌐 Web Logout: Manual redirection fallback');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('❌ Logout Error:', error);
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      // Standard Alert.alert with buttons can be flaky on some web environments
      if (confirm('Are you sure you want to logout?')) {
        performSignOut();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  const copyToClipboard = async () => {
    if (!user) return;
    await Clipboard.setStringAsync(user.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'User ID copied to clipboard');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
            <Avatar imageUri={profile.avatarUri} size="large" />
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={headerAnimatedStyle}>
            <Text style={[styles.name, { color: colors.text }]}>{profile.username}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{profile.email}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.idContainer}>
                <Text style={[styles.userId, { color: colors.textSecondary }]}>ID: {user?.id?.substring(0, 8)}... <Text style={{fontSize: 10}}>(Tap to copy)</Text></Text>
                <Ionicons name="copy-outline" size={12} color={colors.textSecondary} style={{marginLeft: 4}}/>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bonus: Custom AI Personality Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Personality (Bonus)</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Speak like a pirate, be extremely helpful..."
              placeholderTextColor={colors.textSecondary}
              value={systemPrompt}
              onChangeText={handleSaveSystemPrompt}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              This will define how the AI behaves in new conversations.
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={[styles.darkModeContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.leftSection}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <ProfileMenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <ProfileMenuItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <ProfileMenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <ProfileMenuItem
            icon="information-circle-outline"
            title="About"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <ProfileMenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <ProfileMenuItem
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
      
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        initialProfile={profile}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    ...Typography.header,
    fontSize: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  email: {
    ...Typography.body,
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
  },
  userId: {
    ...Typography.caption,
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  darkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    ...Typography.bodyMedium,
    fontSize: 16,
  },
  sectionTitle: {
    ...Typography.subHeader,
    fontSize: 18,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    ...Typography.body,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  hint: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
