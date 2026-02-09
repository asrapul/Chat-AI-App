import { API_CONFIG } from '@/constants/Config';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DigestDetail {
  id: string;
  topic: string;
  content: string;
  generatedAt: string;
  deliveredAt?: string;
  customPrompt?: string;
  sources?: string[];
}

export default function DigestDetailPage() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [digest, setDigest] = useState<DigestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDigest();
  }, [id]);

  const loadDigest = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setDigest(result.digest);
      }
    } catch (error) {
      console.error('Failed to load digest:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Digest not found
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.topicBadge}>
            <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
            <Text style={[styles.topicText, { color: colors.primary }]}>{digest.topic}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Daily Digest: {digest.topic}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(digest.deliveredAt || digest.generatedAt)}
          </Text>
        </View>

        {/* Custom Prompt if exists */}
        {digest.customPrompt && (
          <View style={[styles.promptCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.promptText, { color: colors.text }]}>
              {digest.customPrompt}
            </Text>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.contentCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.contentText, { color: colors.text }]}>
            {digest.content}
          </Text>
        </View>

        {/* Sources if available */}
        {digest.sources && digest.sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <Text style={[styles.sourcesTitle, { color: colors.textSecondary }]}>
              Sources
            </Text>
            {digest.sources.map((source, index) => (
              <Text key={index} style={[styles.sourceLink, { color: colors.primary }]}>
                • {source}
              </Text>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
  contentCard: {
    borderRadius: 16,
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  sourcesSection: {
    marginTop: 20,
    padding: 16,
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sourceLink: {
    fontSize: 13,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
