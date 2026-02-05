import ConversationItem from '@/components/ConversationItem';
import { SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { bulkTogglePinConversations, deleteConversation, deleteMultipleConversations, syncAndRepairConversations, togglePinConversation } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform as RNPlatform, RefreshControl, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConversationListScreen() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);

  // Auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Home Screen Focused - Reloading Data');
      loadData();
    }, [])
  );

  useEffect(() => {
    // Initial load
    loadData();
    // Header entrance animation
    headerTranslateY.value = withDelay(100, withSpring(0, SPRING_CONFIG.SMOOTH));
    headerOpacity.value = withDelay(100, withSpring(1, SPRING_CONFIG.SMOOTH));
  }, []);

  useEffect(() => {
    groupAndFilterConversations();
  }, [conversations, searchQuery]);

  const loadData = async () => {
    // Smart Load: Checks mismatch and repairs if needed
    setIsLoading(true);
    const saved = await syncAndRepairConversations();
    
    if (saved && saved.length > 0) {
      setConversations(saved);
    } else {
      setConversations([]);
    }
    setIsLoading(false);
  };

  const groupAndFilterConversations = () => {
    const filtered = conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinned = filtered.filter(c => c.isPinned);
    const unpinned = filtered.filter(c => !c.isPinned);

    const now = new Date();
    const today = unpinned.filter(c => isSameDay(new Date(c.timestamp), now));
    const yesterday = unpinned.filter(c => {
      const d = new Date(c.timestamp);
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return isSameDay(d, y);
    });
    const earlier = unpinned.filter(c => {
      const d = new Date(c.timestamp);
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      y.setDate(y.getDate() - 1);
      return d < y && !isSameDay(d, y);
    });

    const sections = [];
    if (pinned.length > 0) sections.push({ title: 'Pinned', data: pinned });
    if (today.length > 0) sections.push({ title: 'Today', data: today });
    if (yesterday.length > 0) sections.push({ title: 'Yesterday', data: yesterday });
    if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier });

    setFilteredSections(sections);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };
  
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
    opacity: headerOpacity.value,
  }));
  
  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  const handleNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/chat/new');
  };
  
  const handleConversationPress = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      router.push(`/chat/${id}`);
    }
  };

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isSelectionMode) {
      setSelectedIds(new Set());
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    const performDelete = async () => {
      await deleteMultipleConversations(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      await loadData();
    };

    if (RNPlatform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${count} conversations?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete conversations',
        `Are you sure you want to delete ${count} conversations?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleBulkPin = async () => {
    if (selectedIds.size === 0) return;
    
    await bulkTogglePinConversations(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    loadData();
  };

  const confirmIndividualDelete = (conversation: any) => {
    const performDelete = async () => {
      await deleteConversation(conversation.id);
      await loadData();
    };

    if (RNPlatform.OS === 'web') {
      if (window.confirm('Are you sure? This cannot be undone.')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Conversation',
        'Are you sure? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleLongPress = (conversation: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      conversation.title,
      'Choose an action',
      [
        {
          text: conversation.isPinned ? 'Unpin Conversation' : 'Pin Conversation',
          onPress: async () => {
            await togglePinConversation(conversation.id);
            await loadData();
          },
        },
        {
          text: 'Delete Conversation',
          style: 'destructive',
          onPress: () => confirmIndividualDelete(conversation),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Monox AI</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Conversations</Text>
        </View>
        <TouchableOpacity onPress={toggleSelectionMode} style={[styles.selectButton, { backgroundColor: isSelectionMode ? colors.primary : 'transparent' }]}>
          <Text style={[styles.selectButtonText, { color: isSelectionMode ? '#FFFFFF' : colors.primary }]}>
            {isSelectionMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.border, borderWidth: 1, opacity: isSelectionMode ? 0.5 : 1 }]} pointerEvents={isSelectionMode ? 'none' : 'auto'}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput 
          placeholder="Search conversations..." 
          placeholderTextColor={colors.textLight}
          style={[styles.searchInput, { color: colors.text, outlineStyle: 'none' } as any]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!isSelectionMode}
        />
        {searchQuery.length > 0 && !isSelectionMode && (
           <TouchableOpacity onPress={() => setSearchQuery('')}>
             <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
           </TouchableOpacity>
        )}
      </View>

      {!isSelectionMode && (
        <TouchableOpacity
          onPress={handleNewChat}
          activeOpacity={0.8}
          style={styles.newChatWrapper}
        >
          <View style={[styles.newChatContainer, { backgroundColor: isDark ? '#1A1A1A' : '#F0F2F5', borderColor: colors.border }]}>
            <Ionicons name="add" size={24} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.newChatText, { color: colors.text }]}>New Chat</Text>
          </View>
        </TouchableOpacity>
      )}
      
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem 
            conversation={item} 
            onPress={() => handleConversationPress(item.id)}
            onLongPress={() => handleLongPress(item)}
            selectionMode={isSelectionMode}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => toggleSelection(item.id)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No conversations yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textLight }]}>Start a new chat to begin</Text>
            </View>
          ) : null
        }
      />
      {isSelectionMode && (
        <Animated.View 
          style={[
            styles.bulkActionsBar, 
            { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderTopColor: colors.border }
          ]}
        >
          <TouchableOpacity onPress={handleBulkDelete} disabled={selectedIds.size === 0} style={styles.bulkActionItem}>
            <Ionicons name="trash-outline" size={24} color={selectedIds.size > 0 ? colors.error : colors.textSecondary} />
            <Text style={[styles.bulkActionText, { color: selectedIds.size > 0 ? colors.error : colors.textSecondary }]}>Delete</Text>
          </TouchableOpacity>
          
          <View style={styles.selectionCountContainer}>
            <Text style={[styles.selectionCount, { color: colors.text }]}>{selectedIds.size} Selected</Text>
          </View>
          
          <TouchableOpacity onPress={handleBulkPin} disabled={selectedIds.size === 0} style={styles.bulkActionItem}>
            <Ionicons name="pin-outline" size={24} color={selectedIds.size > 0 ? colors.primary : colors.textSecondary} />
            <Text style={[styles.bulkActionText, { color: selectedIds.size > 0 ? colors.primary : colors.textSecondary }]}>Pin/Unpin</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerSubtitle: {
    ...Typography.header,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    ...Typography.header,
    fontSize: 34,
    letterSpacing: -0.5,
  },
  newChatWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  newChatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  newChatText: {
    ...Typography.bodySemiBold,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.bodySemiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyState: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    ...Typography.subHeader,
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectButtonText: {
    ...Typography.bodySemiBold,
    fontSize: 14,
  },
  bulkActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bulkActionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  bulkActionText: {
    ...Typography.bodyMedium,
    fontSize: 12,
    marginTop: 4,
  },
  selectionCountContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  selectionCount: {
    ...Typography.bodySemiBold,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: 12,
  },
});
