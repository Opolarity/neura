import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { Notification } from '../types/notification.types';
import {
  getNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
} from '../services/notifications.service';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel>;

    const loadNotifications = async () => {
      try {
        const data = await getNotifications(user.id);
        setNotifications(data);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          toast(newNotification.title, {
            description: newNotification.message ?? undefined,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: number) => {
    await markAsReadService(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await markAllAsReadService(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
    );
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
