import { CustomToast } from '@/components/CustomToast';
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
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Teknologi']);
  const [customPrompt, setCustomPrompt] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const toggleTopic = (topicValue: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicValue)) {
        // Don't allow removing all topics
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== topicValue);
      } else {
        return [...prev, topicValue];
      }
    });
  };

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
        // Handle both old single topic and new multi-topic format
        if (settings.topics) {
          setSelectedTopics(settings.topics);
        } else if (settings.topic) {
          setSelectedTopics([settings.topic]);
        }
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

      // Get push token (not available on web)
      let pushToken = null;
      if (Platform.OS !== 'web') {
        pushToken = await registerForPushNotificationsAsync();
        if (!pushToken && enabled) {
          Alert.alert(
            'Push Notification Required',
            'Push notifications are required to receive daily digests. Please enable notifications in your device settings.'
          );
          setSaving(false);
          return;
        }
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
          topics: selectedTopics,
          customPrompt: customPrompt.trim() || null,
          digestEnabled: enabled,
          pushToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Save locally using the SAME key that loadSettings reads
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        await AsyncStorage.setItem('digest_settings', JSON.stringify({
          time: `${hours}:${minutes}`,
          topics: selectedTopics,
          customPrompt: customPrompt.trim(),
          enabled: enabled,
        }));

        showToast('Digest settings saved successfully!', 'success');
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('Failed to save settings. Please try again.', 'error');
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
    console.log('⚡ Generate Digest Now button pressed');
    try {
      setSaving(true);
      const userId = await AsyncStorage.getItem('userId');
      const actualUserId = userId || `user-${Date.now()}`;
      
      if (!userId) {
        await AsyncStorage.setItem('userId', actualUserId);
      }

      // Send current form values to API
      const topicsToSend = selectedTopics.length > 0 ? selectedTopics : ['Teknologi'];
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/send-digest/${actualUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: topicsToSend,
          topic: topicsToSend.join(', '),
          customPrompt: customPrompt || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Digest generated successfully! Redirecting...', 'success');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to generate digest');
      }
    } catch (error) {
      console.error('Generate error:', error);
      showToast('Failed to generate digest. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Digest Settings</Text>
          <View style={{ width: 40 }} />
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
          
          {Platform.OS === 'web' ? (
            // Web: Native HTML time input with custom icon
            <View style={styles.webTimeInputContainer}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: colors.background,
                borderRadius: 17,
                border: `2px solid ${colors.primary}`,
                paddingRight: 16,
              } as any}>
                <input
                  type="time"
                  value={`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`}
                  onChange={(e: any) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(time);
                    newTime.setHours(parseInt(hours), parseInt(minutes));
                    setTime(newTime);
                  }}
                  style={{
                    fontSize: 32,
                    padding: 16,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: colors.primary,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  className="time-input-custom"
                />
                {/* Custom Clock Icon - inline next to numbers */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#00e6ff" strokeWidth="2"/>
                  <path d="M12 7v5l3 3" stroke="#00e6ff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </View>
              <style>{`
                .time-input-custom::-webkit-calendar-picker-indicator {
                  display: none;
                }
              `}</style>
            </View>
          ) : (
            // Native: DateTimePicker
            <>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.background }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.timeText, { color: colors.primary }]}>
                  {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}
            </>
          )}
          
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            You'll receive your digest at this time every day
          </Text>
        </View>

        {/* Topic Selection */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Topics (Select multiple)</Text>
          <View style={styles.topicGrid}>
            {TOPICS.map((t) => {
              const isSelected = selectedTopics.includes(t.value);
              return (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.topicButton,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => toggleTopic(t.value)}
              >
                <View style={styles.topicContent}>
                  <Ionicons 
                    name={t.icon as any} 
                    size={20} 
                    color={isSelected ? '#FFFFFF' : colors.primary} 
                  />
                  <Text
                    style={[
                      styles.topicText,
                      { color: isSelected ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {t.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )})}
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
      <CustomToast 
        message={toastMessage} 
        visible={toastVisible} 
        onHide={() => setToastVisible(false)} 
        type={toastType as 'success' | 'error'}
      />
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
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
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
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  // Web Time Picker Styles
  webTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 16,
  },
  webTimeInputContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  webTimeSelector: {
    alignItems: 'center',
    gap: 8,
  },
  webTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  webTimeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webTimeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTimeDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  webTimeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  webTimeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    marginHorizontal: 16,
  },
  // Roller picker styles
  rollerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  rollerWrapper: {
    height: 132,
    width: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  roller: {
    height: 132,
  },
  rollerContent: {
    paddingVertical: 44,
  },
  rollerItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  rollerHighlight: {
    position: 'absolute',
    top: 44,
    left: 4,
    right: 4,
    height: 44,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
});
