import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewChatScreen() {
  const { colors } = useTheme();

  const activeModels = [
    {
      id: 'gpt-5-2',
      name: 'GPT-5.2',
      description: 'Best for complex coding & reasoning tasks.',
      icon: 'logo-openai',
      color: '#10A37F'
    },
    {
      id: 'gemini-3-pro',
      name: 'Gemini 3 Pro',
      description: 'Huge context window & multimodal skills.',
      icon: 'sparkles',
      color: '#4FACFE'
    },
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      description: 'Nuanced writing & long-form content.',
      icon: 'document-text',
      color: '#D97757'
    },
    {
      id: 'grok-4-1',
      name: 'Grok 4.1',
      description: 'Real-time knowledge & witty responses.',
      icon: 'flash',
      color: '#FFFFFF' // Example color
    },
    {
      id: 'deepseek-v3-2',
      name: 'DeepSeek V3.2',
      description: 'Master of logic & math problems.',
      icon: 'infinite',
      color: '#6366F1'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Search engine for up-to-date answers.',
      icon: 'search',
      color: '#22B3A6' // Example color
    }
  ];

  const handleSelectModel = (modelId: string) => {
    // In a real app, we would create a session with this model ID
    // For now, navigate to a new chat with this ID as parameter/context
    // Using a random ID for the new chat session
    const newSessionId = `new-${Date.now()}`;
    router.replace(`/chat/${newSessionId}?model=${modelId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Chat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Select an AI Model
        </Text>

        <View style={styles.grid}>
          {activeModels.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[styles.modelCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleSelectModel(model.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: model.color + '20' }]}>
                <Ionicons name={model.icon as any} size={28} color={model.color === '#FFFFFF' && colors.background === '#F0F2F5' ? '#000' : model.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: colors.text }]}>{model.name}</Text>
                <Text style={[styles.modelDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {model.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  headerTitle: {
    ...Typography.subHeader,
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    ...Typography.bodySemiBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modelName: {
    ...Typography.bodySemiBold,
    fontSize: 16,
    marginBottom: 8,
  },
  modelDesc: {
    ...Typography.caption,
    fontSize: 13,
    maxWidth: '80%',
  },
});
