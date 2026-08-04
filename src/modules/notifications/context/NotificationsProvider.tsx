import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { Notification } from '../types/notification.types';
import {
  getMyNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
} from '../services/notifications.service';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Provider único (montado en App): Header y Dashboard comparten el mismo
// estado y UN solo canal Realtime, en vez de abrir un canal y un fetch por
// cada consumidor del hook.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<number>>(new Set());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(async (notifyNew: boolean) => {
    try {
      const data = await getMyNotifications();
      if (notifyNew) {
        data
          .filter((n) => !knownIds.current.has(n.id) && !n.isRead)
          .forEach((n) => toast(n.title, { description: n.message ?? undefined }));
      }
      knownIds.current = new Set(data.map((n) => n.id));
      setNotifications(data);
    } catch (error) {
      console.error('[notifications] error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      knownIds.current = new Set();
      return;
    }

    load(false);

    // Sin filtro por usuario: la notificación ya no tiene user_id. La RLS de
    // SELECT (por permisos) decide a quién le entrega Realtime cada INSERT.
    // Ante el evento se refetchea vía RPC en vez de usar el payload: así el
    // resultado es correcto aunque Realtime entregara eventos de más, y el
    // toast solo suena para lo que la RPC confirma como nuevo y no leído.
    const channel = supabase
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          load(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      ),
    );
    await markAsReadService(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })),
    );
    await markAllAsReadService();
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  }
  return context;
}
