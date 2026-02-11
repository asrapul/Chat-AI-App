import ConversationItem from '@/components/ConversationItem';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Profile, RoomWithPreview, supabaseService } from '@/services/supabaseService';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'groups' | 'friends';

export default function SocialScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [groups, setGroups] = useState<RoomWithPreview[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<Profile[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      if (activeTab === 'groups') {
        await loadGroups();
      } else {
        await loadFriendsData();
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadGroups = async () => {
    if (!user) return;
    const rooms = await supabaseService.getRooms(user.id);
    // Filter only Group chats
    const groupRooms = rooms.filter(r => r.type === 'group');
    setGroups(groupRooms);
  };

  const loadFriendsData = async () => {
    if (!user) return;
    const myFriends = await supabaseService.getFriends(user.id);
    setFriends(myFriends);
    
    const myRequests = await supabaseService.getFriendRequests(user.id);
    setRequests(myRequests);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await supabaseService.searchUsers(searchQuery);
    // Filter out self and existing friends
    const filtered = results.filter(p => p.id !== user?.id && !friends.some(f => f.id === p.id));
    setSearchResults(filtered);
    setIsSearching(false);
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    const result = await supabaseService.addFriend(user.id, friendId);
    if (result.success) {
      Alert.alert('Success', 'Friend request sent!');
      setSearchResults(prev => prev.filter(p => p.id !== friendId));
    } else {
      Alert.alert('Error', result.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;
    const success = await supabaseService.acceptFriendRequest(user.id, requesterId);
    if (success) {
      loadFriendsData(); // Reload to update lists
    } else {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const renderGroupItem = ({ item }: { item: RoomWithPreview }) => (
    <ConversationItem
        conversation={{
            id: item.id,
            title: item.name,
            lastMessage: item.last_message || 'No messages yet',
            timestamp: item.last_message_at || item.created_at,
            avatar: 'people',
            unread: 0,
            isPinned: false,
            topic: item.topic as any,
            type: 'supabase',
        }}
        onPress={() => router.push({
            pathname: '/chat/[id]',
            params: { id: item.id, type: 'supabase', topic: item.topic, topicName: item.name }
        })}
        selectionMode={false}
    />
  );

  const renderFriendItem = ({ item, isRequest = false, isSearch = false }: { item: Profile, isRequest?: boolean, isSearch?: boolean }) => (
    <View style={[styles.friendItem, { borderBottomColor: colors.border }]}>
      <View style={styles.friendInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.card }]}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={{ fontSize: 18 }}>👤</Text>
          )}
        </View>
        <Text style={[styles.friendName, { color: colors.text }]}>{item.username || 'User'}</Text>
      </View>
      
      <View style={styles.actions}>
        {isRequest ? (
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAcceptRequest(item.id)}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
            </TouchableOpacity>
        ) : isSearch ? (
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAddFriend(item.id)}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
            </TouchableOpacity>
        ) : (
             <TouchableOpacity 
                onPress={() => {
                    // Start direct chat? Not implemented yet for direct from friend list
                    // Could create a group or direct room
                    Alert.alert('Chat', 'Start chat feature coming soon!');
                }}
            >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Social</Text>
        <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/chat/new?initialTab=group')}
        >
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'groups' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('groups')}
        >
            <Text style={[styles.tabText, { color: activeTab === 'groups' ? colors.primary : colors.text }]}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('friends')}
        >
            <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.primary : colors.text }]}>Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'groups' ? (
        <FlatList
            data={groups}
            keyExtractor={item => item.id}
            renderItem={renderGroupItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text style={{ color: colors.textSecondary }}>No groups yet. Create one!</Text>
                </View>
            }
        />
      ) : (
        <ScrollView 
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search users..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                {searchQuery.length > 0 && (
                     <TouchableOpacity onPress={handleSearch}>
                        <Text style={{ color: colors.primary }}>Search</Text>
                     </TouchableOpacity>
                )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Search Results</Text>
                    {searchResults.map(item => (
                        <View key={item.id}>{renderFriendItem({ item, isSearch: true })}</View>
                    ))}
                </View>
            )}

            {/* Friend Requests */}
            {requests.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Friend Requests</Text>
                    {requests.map(item => (
                        <View key={item.id}>{renderFriendItem({ item, isRequest: true })}</View>
                    ))}
                </View>
            )}

            {/* Friends List */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>My Friends ({friends.length})</Text>
                {friends.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No friends yet. Search to add!</Text>
                ) : (
                    friends.map(item => (
                        <View key={item.id}>{renderFriendItem({ item })}</View>
                    ))
                )}
            </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.header,
    fontSize: 28,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // fallback
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.caption,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
