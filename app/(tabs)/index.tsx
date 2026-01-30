import ConversationItem from '@/components/ConversationItem';
import { SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { conversations as mockConversations } from '@/data/mockData';
import { getSavedConversations, saveConversations } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConversationListScreen() {
  const { colors, isDark } = useTheme();
  const [conversations, setConversations] = useState(mockConversations);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadData();
    // Header entrance animation
    headerTranslateY.value = withDelay(100, withSpring(0, SPRING_CONFIG.SMOOTH));
    headerOpacity.value = withDelay(100, withSpring(1, SPRING_CONFIG.SMOOTH));
  }, []);

  useEffect(() => {
    groupAndFilterConversations();
  }, [conversations, searchQuery]);
  
  const loadData = async () => {
    const saved = await getSavedConversations();
    
    // Migration: If user has old mock data (id '1'), replace with new models
    const hasOldData = saved && saved.some(c => c.id === '1');
    
    if (saved && !hasOldData) {
      setConversations(saved);
    } else {
      // Either first time or has old mock data
      setConversations(mockConversations);
      await saveConversations(mockConversations);
    }
  };

  const groupAndFilterConversations = () => {
    const filtered = conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const today = filtered.filter(c => isSameDay(new Date(c.timestamp), now));
    const yesterday = filtered.filter(c => {
      const d = new Date(c.timestamp);
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return isSameDay(d, y);
    });
    const earlier = filtered.filter(c => {
      const d = new Date(c.timestamp);
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      y.setDate(y.getDate() - 1);
      return d < y && !isSameDay(d, y);
    }).slice(0, 3);

    const sections = [];
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
    router.push(`/chat/${id}`);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Welcome back,</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        </View>
      </Animated.View>

      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput 
          placeholder="Search conversations..." 
          placeholderTextColor={colors.textLight}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
           <TouchableOpacity onPress={() => setSearchQuery('')}>
             <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
           </TouchableOpacity>
        )}
      </View>

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
      
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handleConversationPress(item.id)}
            index={index}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
            {title}
          </Text>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        stickySectionHeadersEnabled={false}
      />
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
    ...Typography.bodySemiBold,
    fontSize: 13,
    paddingHorizontal: 24,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
  },
});
