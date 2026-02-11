import supabase from '@/lib/supabase';
import { SupabaseMessage } from '@/services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

interface TypingUser {
  userId: string;
  username: string;
  isTyping: boolean;
}

interface PresenceUser {
  userId: string;
  username: string;
  onlineAt: string;
}

interface UseRealtimeMessagesReturn {
  /** New messages received via realtime */
  realtimeMessages: SupabaseMessage[];
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Users currently online in the room */
  onlineUsers: PresenceUser[];
  /** Send a typing indicator */
  sendTyping: (userId: string, username: string, isTyping: boolean) => void;
  /** Track presence (call once when entering a room) */
  trackPresence: (userId: string, username: string) => void;
  /** Clear realtime messages (e.g. after merging with state) */
  clearRealtimeMessages: () => void;
}

export function useRealtimeMessages(roomId: string | undefined): UseRealtimeMessagesReturn {
  const [realtimeMessages, setRealtimeMessages] = useState<SupabaseMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!roomId) return;

    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName);

    // A. Live Messages (Postgres Changes)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const newMessage = payload.new as SupabaseMessage;
        setRealtimeMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    );

    // B. Typing Indicator (Broadcast)
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const data = payload.payload as TypingUser;
      if (!data) return;

      if (data.isTyping) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === data.userId);
          if (existing) return prev;
          return [...prev, data];
        });

        // Auto-remove typing after 3 seconds
        const existingTimeout = typingTimeoutRef.current.get(data.userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
          typingTimeoutRef.current.delete(data.userId);
        }, 3000);

        typingTimeoutRef.current.set(data.userId, timeout);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        const existingTimeout = typingTimeoutRef.current.get(data.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutRef.current.delete(data.userId);
        }
      }
    });

    // C. Online Status (Presence)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: PresenceUser[] = [];

      Object.values(state).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          users.push({
            userId: presence.userId,
            username: presence.username,
            onlineAt: presence.onlineAt,
          });
        });
      });

      setOnlineUsers(users);
    });

    channel.subscribe();
    channelRef.current = channel;

    // ⚠️ CLEANUP WAJIB - pakai removeChannel, bukan unsubscribe!
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;

      // Clear all typing timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [roomId]);

  const sendTyping = (userId: string, username: string, isTyping: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, username, isTyping },
    });
  };

  const trackPresence = async (userId: string, username: string) => {
    if (!channelRef.current) return;
    await channelRef.current.track({
      userId,
      username,
      onlineAt: new Date().toISOString(),
    });
  };

  const clearRealtimeMessages = () => {
    setRealtimeMessages([]);
  };

  return {
    realtimeMessages,
    typingUsers,
    onlineUsers,
    sendTyping,
    trackPresence,
    clearRealtimeMessages,
  };
}
