import { API_CONFIG } from '@/constants/Config';
import { useTheme } from '@/context/ThemeContext';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const TOPICS = [
  { label: 'Teknologi', value: 'Teknologi', icon: 'laptop-outline' },
  { label: 'Bisnis', value: 'Bisnis', icon: 'briefcase-outline' },
  { label: 'Olahraga', value: 'Olahraga', icon: 'football-outline' },
  { label: 'Hiburan', value: 'Hiburan', icon: 'film-outline' },
  { label: 'Kesehatan', value: 'Kesehatan', icon: 'fitness-outline' },
  { label: 'Internasional', value: 'Internasional', icon: 'globe-outline' },
];

export default function DigestSettings() {
  const { colors } = useTheme();
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [topic, setTopic] = useState('Teknologi');
  const [customPrompt, setCustomPrompt] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('digest_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.time) {
          const [hours, minutes] = settings.time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0);
          setTime(date);
        }
        setTopic(settings.topic || 'Teknologi');
        setCustomPrompt(settings.customPrompt || '');
        setEnabled(settings.enabled || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Get user ID
      const userId = await AsyncStorage.getItem('userId');
      const actualUserId = userId || `user-${Date.now()}`;
      if (!userId) {
        await AsyncStorage.setItem('userId', actualUserId);
      }

      // Get push token
      const pushToken = await registerForPushNotificationsAsync();
      
      if (!pushToken && enabled) {
        Alert.alert(
          'Push Notification Required',
          'Push notifications are required to receive daily digests. Please enable notifications in your device settings.'
        );
        setSaving(false);
        return;
      }

      // Convert local time to UTC hour
      const localHour = time.getHours();
      const now = new Date();
      now.setHours(localHour, 0, 0, 0);
      const utcHour = now.getUTCHours();

      // Save to backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: actualUserId,
          digestTimeUTC: utcHour,
          topic,
          customPrompt: customPrompt.trim() || null,
          digestEnabled: enabled,
          pushToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Save locally
        await AsyncStorage.setItem('digest_settings', JSON.stringify({
          time: `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`,
          topic,
          customPrompt,
          enabled,
        }));

        Alert.alert('Success', 'Digest settings saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const handleGenerateNow = async () => {
    try {
      setSaving(true);
      const userId = await AsyncStorage.getItem('userId');
      const actualUserId = userId || `user-${Date.now()}`;
      
      if (!userId) {
        await AsyncStorage.setItem('userId', actualUserId);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/send-digest/${actualUserId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success!', 
          'Digest generated and sent successfully! Check history to view it.',
          [
            { text: 'View History', onPress: () => router.push('/digest/history' as any) },
            { text: 'OK' }
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to generate digest');
      }
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('Error', 'Failed to generate digest. Please check your settings and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Daily Digest</Text>
          <TouchableOpacity
            style={[styles.historyButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => router.push('/digest/history' as any)}
          >
            <Text style={[styles.historyButtonText, { color: colors.primary }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Enable Daily Digest</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Receive daily news digest at your preferred time
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={enabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Generate Now Button */}
        <TouchableOpacity
          style={[styles.generateNowButton, { 
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary,
            opacity: saving ? 0.7 : 1,
          }]}
          onPress={handleGenerateNow}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
          <Text style={[styles.generateNowText, { color: colors.primary }]}>
            {saving ? 'Generating...' : 'Generate Digest Now'}
          </Text>
        </TouchableOpacity>

        {/* Time Picker */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, { backgroundColor: colors.background }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.timeText, { color: colors.primary }]}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            You'll receive your digest at this time every day
          </Text>
          
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
        </View>

        {/* Topic Selection */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Topic</Text>
          <View style={styles.topicGrid}>
            {TOPICS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.topicButton,
                  { 
                    backgroundColor: topic === t.value ? colors.primary : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setTopic(t.value)}
              >
                <View style={styles.topicContent}>
                  <Ionicons 
                    name={t.icon as any} 
                    size={20} 
                    color={topic === t.value ? '#FFFFFF' : colors.primary} 
                  />
                  <Text
                    style={[
                      styles.topicText,
                      { color: topic === t.value ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {t.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Prompt */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Prompt (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            placeholder="e.g., Focus on AI and machine learning news in Indonesia"
            placeholderTextColor={colors.textSecondary}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Customize how AI generates your digest
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 13,
    marginTop: 8,
  },
  timeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '47%',
  },
  topicText: {
    fontSize: 15,
    fontWeight: '500',
 textAlign: 'center',
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  generateNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  generateNowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 100,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
