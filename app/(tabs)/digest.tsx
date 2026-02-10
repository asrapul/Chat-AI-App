import { API_CONFIG } from '@/constants/Config';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
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

export default function DigestHistoryScreen() {
  const { colors } = useTheme();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Notification state
  const [newDigest, setNewDigest] = useState<Digest | null>(null);
  const notifAnim = useRef(new Animated.Value(-100)).current;
  const knownIdsRef = useRef<Set<string>>(new Set());
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        userId = `user-${Date.now()}`;
        await AsyncStorage.setItem('userId', userId);
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/digest/history/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        const fetchedDigests: Digest[] = result.digests || [];
        
        // Detect new digests
        if (knownIdsRef.current.size > 0) {
          for (const d of fetchedDigests) {
            if (!knownIdsRef.current.has(d.id)) {
              showNotification(d);
              break; // Show one notification at a time
            }
          }
        }
        
        // Update known IDs
        knownIdsRef.current = new Set(fetchedDigests.map(d => d.id));
        setDigests(fetchedDigests);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showNotification = (digest: Digest) => {
    setNewDigest(digest);
    // Slide in
    Animated.spring(notifAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    // Auto-hide after 8 seconds
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => hideNotification(), 8000);
  };

  const hideNotification = () => {
    Animated.timing(notifAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNewDigest(null));
  };

  const handleNotifPress = () => {
    if (newDigest) {
      hideNotification();
      router.push(`/digest/${newDigest.id}` as any);
    }
  };

  // Poll for new digests every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTrashPress = () => {
    if (Platform.OS === 'web') {
      // Web: use a simple prompt-based flow
      const choice = window.confirm('Pilih OK untuk masuk mode "Pilih & Hapus".\nPilih Cancel lalu tekan tombol sampah lagi untuk "Hapus Semua".');
      if (choice) {
        setSelectMode(true);
        setSelectedIds(new Set());
      } else {
        // Ask for clear all
        const clearAll = window.confirm('Hapus SEMUA digest?');
        if (clearAll) {
          (async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              await fetch(`${API_CONFIG.BASE_URL}/api/digest/history/${userId}`, { method: 'DELETE' });
              setDigests([]);
            } catch (e) { console.error(e); }
          })();
        }
      }
    } else {
      // Native: Alert with options
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Hapus Digest',
        'Pilih cara menghapus:',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Pilih & Hapus',
            onPress: () => {
              setSelectMode(true);
              setSelectedIds(new Set());
            }
          },
          { 
            text: 'Hapus Semua', 
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Konfirmasi',
                'Yakin ingin menghapus semua digest?',
                [
                  { text: 'Batal', style: 'cancel' },
                  {
                    text: 'Hapus Semua',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const userId = await AsyncStorage.getItem('userId');
                        await fetch(`${API_CONFIG.BASE_URL}/api/digest/history/${userId}`, { method: 'DELETE' });
                        setDigests([]);
                      } catch (e) { console.error(e); }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    
    const doDelete = async () => {
      try {
        for (const id of selectedIds) {
          await fetch(`${API_CONFIG.BASE_URL}/api/digest/${id}`, { method: 'DELETE' });
        }
        setSelectMode(false);
        setSelectedIds(new Set());
        loadHistory();
      } catch (e) { console.error(e); }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`Hapus ${selectedIds.size} digest yang dipilih?`);
      if (ok) doDelete();
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Hapus Digest',
        `Hapus ${selectedIds.size} digest yang dipilih?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  if (loading && !refreshing && digests.length === 0) {
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
        <Text style={[styles.title, { color: colors.text }]}>Digest History</Text>
        
        <View style={styles.headerButtons}>
            {selectMode ? (
              <>
                <TouchableOpacity onPress={() => { setSelectMode(false); setSelectedIds(new Set()); }} style={styles.iconButton}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteSelected}
                  style={[styles.deleteSelectedBtn, { backgroundColor: selectedIds.size > 0 ? '#FF6B6B' : colors.border }]}
                >
                  <Ionicons name="trash" size={18} color="#FFF" />
                  <Text style={styles.deleteSelectedText}>Hapus ({selectedIds.size})</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {digests.length > 0 && (
                  <TouchableOpacity onPress={handleTrashPress} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => router.push('/digest/settings')} 
                  style={[styles.settingsButton, { backgroundColor: colors.cardBackground }]}
                >
                  <Ionicons name="settings-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
        </View>
      </View>

      {/* New Digest Notification Banner */}
      {newDigest && (
        <Animated.View style={[styles.notifBanner, { transform: [{ translateY: notifAnim }] }]}>
          <TouchableOpacity style={styles.notifContent} onPress={handleNotifPress} activeOpacity={0.85}>
            <View style={styles.notifIcon}>
              <Ionicons name="newspaper" size={20} color="#FFF" />
            </View>
            <View style={styles.notifTextWrap}>
              <Text style={styles.notifTitle}>📰 Berita Baru!</Text>
              <Text style={styles.notifBody} numberOfLines={1}>
                Digest "{newDigest.topic}" telah ditambahkan. Tap untuk membaca.
              </Text>
            </View>
            <TouchableOpacity onPress={hideNotification} style={styles.notifClose}>
              <Ionicons name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

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
              Enable daily digest in settings to start receiving news
            </Text>
            <TouchableOpacity 
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/digest/settings')}
            >
              <Text style={styles.ctaText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          digests.map((digest) => (
            <TouchableOpacity
              key={digest.id}
              style={[
                styles.card, 
                { backgroundColor: colors.cardBackground },
                selectMode && selectedIds.has(digest.id) && { borderWidth: 2, borderColor: colors.primary }
              ]}
              onPress={() => {
                if (selectMode) {
                  toggleSelect(digest.id);
                } else {
                  router.push(`/digest/${digest.id}` as any);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.topicBadge}>
                  <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
                  <Text style={[styles.topic, { color: colors.primary }]}>{digest.topic}</Text>
                </View>
                {selectMode && (
                  <Ionicons 
                    name={selectedIds.has(digest.id) ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={selectedIds.has(digest.id) ? colors.primary : colors.textSecondary} 
                  />
                )}
              </View>
              <Text style={[styles.date, { color: colors.textSecondary, marginBottom: 8 }]}>
                  {formatDate(digest.deliveredAt || digest.generatedAt)}
              </Text>
              <Text
                style={[styles.preview, { color: colors.text }]}
                numberOfLines={3}
              >
                {digest.content}
              </Text>
              {!selectMode && (
                <View style={styles.readMore}>
                  <Text style={[styles.readMoreText, { color: colors.primary }]}>Read more</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
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
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteSelectedText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
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
    marginBottom: 24,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  notifBanner: {
    position: 'absolute',
    top: 70,
    left: 12,
    right: 12,
    zIndex: 999,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notifContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTextWrap: {
    flex: 1,
  },
  notifTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  notifBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  notifClose: {
    padding: 4,
  },
});
