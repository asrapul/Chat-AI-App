import supabase from '@/lib/supabase';

// ---- Types ----
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'ai';
  topic: string;
  created_by: string;
  created_at: string;
}

export interface RoomWithPreview extends Room {
  last_message?: string;
  last_message_at?: string;
}

export interface SupabaseMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  sender_type: 'user' | 'ai';
  image_url?: string | null;
  created_at: string;
  profile?: Profile;
}

// ---- Profile ----
export const supabaseService = {
  // Get current user's profile
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'username' | 'avatar_url'>>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    return true;
  },

  // Upload avatar
  async uploadAvatar(userId: string, imageUri: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const fileName = `${userId}/avatar-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
           contentType: 'image/jpeg',
           upsert: false,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      return publicUrl;
    } catch (e) {
      console.error('Error in uploadAvatar:', e);
      return null;
    }
  },

  // ---- Rooms ----
  // Create a new room and add creator as member
  // Create a new room and add creator + initial members
  async createRoom(
    name: string, 
    userId: string, 
    topic: string = 'general', 
    type: 'direct' | 'group' | 'ai' = 'ai',
    initialMembers: string[] = []
  ): Promise<Room | null> {
    // 1. Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        type,
        topic,
        created_by: userId,
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error('Error creating room:', roomError);
      return null;
    }

    // 2. Add members using RPC (Security Definer) to bypass RLS
    // Filter out duplicates and ensure creator is included
    const uniqueMembers = new Set([...initialMembers, userId]);
    const memberIds = Array.from(uniqueMembers);

    const { error: memberError } = await supabase.rpc('add_group_members', {
      _room_id: room.id,
      _user_ids: memberIds,
    });

    if (memberError) {
      console.error('Error adding room members via RPC:', memberError);
      // We could try fallback or just log it. 
      // If RPC fails, room is created but empty (except creator might see it due to "created_by" policy)
    }

    return room;
  },

  // Get rooms the user is a member of
  async getRooms(userId: string): Promise<RoomWithPreview[]> {
    // Get room IDs user is member of
    const { data: memberships, error: memberError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);

    if (memberError || !memberships || memberships.length === 0) {
      return [];
    }

    const roomIds = memberships.map(m => m.room_id);

    // Get rooms
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false });

    if (roomError || !rooms) {
      console.error('Error fetching rooms:', roomError);
      return [];
    }

    // Get last message for each room
    const roomsWithPreview: RoomWithPreview[] = await Promise.all(
      rooms.map(async (room) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...room,
          last_message: lastMsg?.content || '',
          last_message_at: lastMsg?.created_at || room.created_at,
        };
      })
    );

    // Sort by last_message_at descending
    roomsWithPreview.sort((a, b) =>
      new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );

    return roomsWithPreview;
  },

  // Delete a room
  async deleteRoom(roomId: string): Promise<boolean> {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Error deleting room:', error);
      return false;
    }
    return true;
  },

  // Delete multiple rooms
  async deleteMultipleRooms(roomIds: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .in('id', roomIds);

    if (error) {
      console.error('Error deleting rooms:', error);
      return false;
    }
    return true;
  },

  // ---- Messages ----
  // Get messages for a room
  async getMessages(roomId: string): Promise<SupabaseMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles for these messages
    const userIds = Array.from(new Set(data.map(m => m.user_id).filter(id => id)));
    
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profiles) {
            // Map profiles to messages
            return data.map(m => ({
                ...m,
                profile: profiles.find(p => p.id === m.user_id)
            }));
        }
    }
    
    return data || [];
  },

  // Send a message
  async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    senderType: 'user' | 'ai' = 'user',
    imageUrl?: string
  ): Promise<SupabaseMessage | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content,
        sender_type: senderType,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    return data;
  },

  // ---- Friends ----
  // Search users by username (simple contains search)
  async searchUsers(query: string): Promise<Profile[]> {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }
    return data || [];
  },

  // Get list of accepted friends
  async getFriends(userId: string): Promise<Profile[]> {
    try {
      // Get all accepted friendships where user is either sender or receiver
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          user_id,
          friend_id,
          status
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;
      if (!friendships || friendships.length === 0) return [];

      // Extract friend IDs
      const friendIds = friendships.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );
      
      if (friendIds.length === 0) return [];

      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);
        
      if (profileError) throw profileError;
      
      return profiles || [];
    } catch (e) {
      console.error('Error getting friends:', e);
      return [];
    }
  },

  // Get pending friend requests (received)
  async getFriendRequests(userId: string): Promise<Profile[]> {
    try {
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          user_id,
          status
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      if (!requests || requests.length === 0) return [];
      
      const senderIds = requests.map(r => r.user_id);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);
        
      if (profileError) throw profileError;
      
      return profiles || [];
    } catch (e) {
      console.error('Error getting friend requests:', e);
      return [];
    }
  },

  // Send friend request
  async addFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    if (userId === friendId) return { success: false, error: "You cannot add yourself." };
    
    // Check if already friends or requested
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();
      
    if (existing) {
      if (existing.status === 'accepted') return { success: false, error: "Already friends." };
      if (existing.status === 'pending') return { success: false, error: "Request already pending." };
      if (existing.status === 'blocked') return { success: false, error: "Unable to add friend." };
    }

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      console.error('Error adding friend:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // Accept friend request
  async acceptFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('user_id', requesterId)
      .eq('friend_id', userId) // I am the friend (receiver)
      .eq('status', 'pending');

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
    return true;
  },
  
  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
     const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
      
    if (error) {
        console.error('Error removing friend:', error);
        return false;
    }
    return true;
  }
};
