import { API_CONFIG } from '@/constants/Config';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Digest {
  id: string;
  topic: string;
  content: string;
  generatedAt: string;
  deliveredAt?: string;
}

export default function DigestHistory() {
  const { colors } = useTheme();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Get or create userId
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        // Generate new userId and save it
        userId = `user-${Date.now()}`;
        await AsyncStorage.setItem('userId', userId);
        console.log('Created new userId:', userId);
      }
      
      console.log('Loading history for userId:', userId);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/history/${userId}`);
      const result = await response.json();
      
      console.log('History result:', result);

      if (result.success) {
        setDigests(result.digests || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Digest History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {digests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No digests yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Enable daily digest in settings to receive personalized news
            </Text>
          </View>
        ) : (
          digests.map((digest) => (
            <TouchableOpacity
              key={digest.id}
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push(`/digest/${digest.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.topicBadge}>
                  <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
                  <Text style={[styles.topic, { color: colors.primary }]}>{digest.topic}</Text>
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  {formatDate(digest.deliveredAt || digest.generatedAt)}
                </Text>
              </View>
              <Text
                style={[styles.preview, { color: colors.text }]}
                numberOfLines={3}
              >
                {digest.content}
              </Text>
              <View style={styles.readMore}>
                <Text style={[styles.readMoreText, { color: colors.primary }]}>Read more</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topic: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
