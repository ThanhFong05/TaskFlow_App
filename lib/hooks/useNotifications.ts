'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'TEAM_INVITED' | 'ROLE_UPDATED' | 'SYSTEM';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    // Setup periodic refresh every 20s as fallback
    const interval = setInterval(fetchNotifications, 20000);

    // Setup Supabase Realtime channel for this user's notifications
    const supabase = createClient();
    const channel = supabase.channel(`user-notifications-${userId}`, {
      config: { broadcast: { self: true } },
    });

    channel.on('broadcast', { event: 'new_notification' }, (payload) => {
      if (payload.payload) {
        setNotifications((prev) => [payload.payload, ...prev]);
        setUnreadCount((c) => c + 1);

        // Optional: browser notification or sound
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.payload.title || 'New Notification', {
            body: payload.payload.message,
          });
        }
      }
    });

    channel.subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch('/api/notifications/read-all', { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
