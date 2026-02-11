import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Profile, supabaseService } from '@/services/supabaseService';
import { createLocalConversation } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function NewChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const isGroupMode = params.initialTab === 'group';
  
  const [isCreatingGroup, setIsCreatingGroup] = useState(isGroupMode);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (user && isCreatingGroup) {
      loadFriends();
    }
  }, [user, isCreatingGroup]);

  // Handle specific mode cleanup/setup if needed
  React.useEffect(() => {
    if (isGroupMode) {
        setIsCreatingGroup(true);
    }
  }, [isGroupMode]);

  const loadFriends = async () => {
    if (!user) return;
    const myFriends = await supabaseService.getFriends(user.id);
    setFriends(myFriends);
  };

  const toggleFriend = (id: string) => {
    const newSet = new Set(selectedFriends);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFriends(newSet);
  };

  const aiTopics = [
    {
      id: 'llm',
      name: 'Language Models',
      description: 'Chat with advanced AI for any conversation',
      icon: 'ChatIcon',
      color: '#10A37F',
      gradient: ['#10A37F', '#0EA37A']
    },
    {
      id: 'image-gen',
      name: 'Image Generator',
      description: 'Create stunning visuals from text prompts',
      icon: 'ImageIcon',
      color: '#FF6B9D',
      gradient: ['#FF6B9D', '#C06C84']
    },
    {
      id: 'video-gen',
      name: 'Video Creator',
      description: 'Generate videos with AI technology',
      icon: 'VideoIcon',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED']
    },
    {
      id: 'voice-music',
      name: 'Voice & Music',
      description: 'Create audio, voices, and music tracks',
      icon: 'AudioIcon',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB']
    },
    {
      id: 'coding',
      name: 'Coding Assistant',
      description: 'Get help with programming and development',
      icon: 'CodeIcon',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706']
    },
    {
      id: 'analytics',
      name: 'AI Analytics',
      description: 'Predictive insights and recommendations',
      icon: 'AnalyticsIcon',
      color: '#EC4899',
      gradient: ['#EC4899', '#DB2777']
    }
  ];

  const handleSelectTopic = async (topicId: string) => {
    const topic = aiTopics.find(t => t.id === topicId);
    const title = topic?.name || 'New Chat';

    // Create LOCAL AI conversation
    const id = await createLocalConversation(title, topicId);
    
    // Navigate with type='local'
    router.replace(`/chat/${id}?type=local&model=monox-ai&topic=${topicId}&topicName=${encodeURIComponent(title)}&topicIcon=${topic?.icon || 'ChatIcon'}`);
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;
    setLoading(true);

    const room = await supabaseService.createRoom(
      groupName.trim(),
      user.id,
      'general',
      'group', // User created room -> type: group
      Array.from(selectedFriends) // Add selected friends
    );

    if (room) {
      // Navigate with type='supabase' and topic (critical for isAI logic)
      router.replace(`/chat/${room.id}?type=supabase&topic=${room.topic}&topicName=${encodeURIComponent(room.name)}`);
    } else {
      console.error('Failed to create room');
    }
    setLoading(false);
  };

  const renderIcon = (iconName: string, color: string) => {
    const iconProps = { width: 28, height: 28, fill: color };
    
    switch (iconName) {
      case 'ChatIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill={color}/>
          </Svg>
        );
      case 'ImageIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill={color}/>
          </Svg>
        );
      case 'VideoIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill={color}/>
          </Svg>
        );
      case 'AudioIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" fill={color}/>
          </Svg>
        );
      case 'CodeIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill={color}/>
          </Svg>
        );
      case 'AnalyticsIcon':
        return (
          <Svg {...iconProps} viewBox="0 0 24 24">
            <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill={color}/>
          </Svg>
        );
      default:
        return <Ionicons name="flash" size={28} color={color} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brandName, { color: colors.primary }]}>Monox AI</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isCreatingGroup ? 'New Group' : 'Choose Your Tool'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {isCreatingGroup ? (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Create New Group</Text>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter group name..."
                  placeholderTextColor={colors.textLight}
                  value={groupName}
                  onChangeText={setGroupName}
                  autoFocus
                />
              </View>

              
              {/* Friend Selection UI */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Friends (Optional)</Text>
              {friends.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                     No friends found. Add friends from the Social tab first.
                  </Text>
              ) : (
                  <View style={{ marginBottom: 20 }}>
                    <FlatList
                        data={friends}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingRight: 20 }}
                        renderItem={({ item }) => {
                            const isSelected = selectedFriends.has(item.id);
                            return (
                                <TouchableOpacity 
                                    style={[
                                        styles.friendChip, 
                                        { 
                                            backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                                            borderColor: isSelected ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => toggleFriend(item.id)}
                                >
                                    {item.avatar_url ? (
                                        <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
                                    ) : (
                                        <View style={[styles.friendAvatar, { backgroundColor: '#ccc' }]} />
                                    )}
                                    <Text style={[
                                        styles.friendName, 
                                        { color: isSelected ? '#fff' : colors.text }
                                    ]}>{item.username || 'User'}</Text>
                                    {isSelected && (
                                        <View style={styles.checkmark}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                  </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor: colors.border }]} 
                  onPress={() => {
                      if (isGroupMode) {
                          router.back();
                      } else {
                          setIsCreatingGroup(false);
                      }
                  }}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.primary, opacity: !groupName.trim() || loading ? 0.7 : 1 }]} 
                  onPress={handleCreateGroup}
                  disabled={!groupName.trim() || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.buttonText, { color: '#FFF' }]}>Create Group</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                What would you like to create today?
              </Text>

              <View style={styles.grid}>
                {/* New Group Chat Option */}
                <TouchableOpacity
                  style={[styles.topicCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => setIsCreatingGroup(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people" size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topicName, { color: colors.text }]}>New Group Chat</Text>
                    <Text style={[styles.topicDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      Create a room and invite others to chat
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {aiTopics.map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={() => handleSelectTopic(topic.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: topic.color + '15' }]}>
                      {renderIcon(topic.icon, topic.color)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.topicName, { color: colors.text }]}>{topic.name}</Text>
                      <Text style={[styles.topicDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {topic.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textLight }]}>
                  Powered by Monox AI • All tools in one place
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  brandName: {
    ...Typography.bodySemiBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    ...Typography.subHeader,
    fontSize: 24,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: 15,
    marginBottom: 20,
  },
  grid: {
    gap: 14,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicName: {
    ...Typography.bodySemiBold,
    fontSize: 17,
    marginBottom: 6,
  },
  topicDesc: {
    ...Typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    ...Typography.caption,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.bodySemiBold,
    fontSize: 16,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    height: 40,
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  friendName: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 6,
  },
});
