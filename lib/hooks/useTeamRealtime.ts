'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  onlineAt?: string;
}

export interface UseTeamRealtimeOptions {
  teamId: string;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string;
  } | null;
  onNewMessage?: (message: any) => void;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function useTeamRealtime({
  teamId,
  currentUser,
  onNewMessage,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: UseTeamRealtimeOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Keep latest callbacks in refs to avoid re-subscribing on every render
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const onTaskCreatedRef = useRef(onTaskCreated);
  onTaskCreatedRef.current = onTaskCreated;

  const onTaskUpdatedRef = useRef(onTaskUpdated);
  onTaskUpdatedRef.current = onTaskUpdated;

  const onTaskDeletedRef = useRef(onTaskDeleted);
  onTaskDeletedRef.current = onTaskDeleted;

  useEffect(() => {
    if (!teamId) return;

    const supabase = createClient();
    const channelName = `team-room-${teamId}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: {
          key: currentUser?.id || 'anonymous',
        },
      },
    });

    // 1. Listen to Broadcast: Messages
    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      if (payload.payload && onNewMessageRef.current) {
        onNewMessageRef.current(payload.payload);
      }
    });

    // 2. Listen to Broadcast: Tasks
    channel.on('broadcast', { event: 'task_created' }, (payload) => {
      if (payload.payload && onTaskCreatedRef.current) {
        onTaskCreatedRef.current(payload.payload);
      }
    });

    channel.on('broadcast', { event: 'task_updated' }, (payload) => {
      if (payload.payload && onTaskUpdatedRef.current) {
        onTaskUpdatedRef.current(payload.payload);
      }
    });

    channel.on('broadcast', { event: 'task_deleted' }, (payload) => {
      if (payload.payload?.taskId && onTaskDeletedRef.current) {
        onTaskDeletedRef.current(payload.payload.taskId);
      }
    });

    // 3. Listen to Broadcast: Typing
    channel.on('broadcast', { event: 'user_typing' }, (payload) => {
      const { userName, isTyping } = payload.payload || {};
      if (!userName) return;

      if (isTyping) {
        setTypingUsers((prev) => Array.from(new Set([...prev, userName])));

        // Clear existing timeout for this user
        if (typingTimeoutRef.current[userName]) {
          clearTimeout(typingTimeoutRef.current[userName]);
        }

        // Auto remove typing status after 3 seconds
        typingTimeoutRef.current[userName] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== userName));
        }, 3000);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== userName));
      }
    });

    // 4. Listen to Presence: Online / Offline
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const usersMap = new Map<string, OnlineUser>();

        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) {
              usersMap.set(p.userId, {
                userId: p.userId,
                name: p.name || 'User',
                email: p.email || '',
                onlineAt: p.onlineAt,
              });
            }
          });
        });

        setOnlineUsers(Array.from(usersMap.values()));
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        setOnlineUsers((prev) => {
          const updated = [...prev];
          newPresences.forEach((np: any) => {
            if (np.userId && !updated.some((u) => u.userId === np.userId)) {
              updated.push({
                userId: np.userId,
                name: np.name || 'User',
                email: np.email || '',
                onlineAt: np.onlineAt,
              });
            }
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        const leftIds = new Set(leftPresences.map((lp: any) => lp.userId));
        setOnlineUsers((prev) => prev.filter((u) => !leftIds.has(u.userId)));
      });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        if (currentUser?.id) {
          await channel.track({
            userId: currentUser.id,
            name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            onlineAt: new Date().toISOString(),
          });
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      // Cleanup timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [teamId, currentUser?.id, currentUser?.email, currentUser?.name]);

  // Broadcast Helper Methods
  const broadcastNewMessage = useCallback((message: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });
    }
  }, []);

  const broadcastTaskCreated = useCallback((task: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'task_created',
        payload: task,
      });
    }
  }, []);

  const broadcastTaskUpdated = useCallback((task: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'task_updated',
        payload: task,
      });
    }
  }, []);

  const broadcastTaskDeleted = useCallback((taskId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'task_deleted',
        payload: { taskId },
      });
    }
  }, []);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (channelRef.current && currentUser) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'user_typing',
          payload: {
            userName: currentUser.name || currentUser.email?.split('@')[0] || 'A member',
            isTyping,
          },
        });
      }
    },
    [currentUser]
  );

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    broadcastNewMessage,
    broadcastTaskCreated,
    broadcastTaskUpdated,
    broadcastTaskDeleted,
    broadcastTyping,
  };
}
