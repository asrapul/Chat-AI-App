import Avatar from '@/components/Avatar';
import EditProfileModal from '@/components/EditProfileModal';
import ProfileMenuItem from '@/components/ProfileMenuItem';
import { SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/apiService';
import { getUserProfile, UserProfile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Removed ScrollView from react-native-gesture-handler to avoid freezes
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    username: 'John Doe',
    email: 'john.doe@example.com',
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
    const userProfile = await getUserProfile();
    setProfile(userProfile);
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
  
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
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
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
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
