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
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/** Tamaño de página del feed: el panel muestra 10 y va pidiendo de 10 en 10. */
export const NOTIFICATIONS_PAGE_SIZE = 10;

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Provider único (montado en App): Header y Dashboard comparten el mismo
// estado y UN solo canal Realtime, en vez de abrir un canal y un fetch por
// cada consumidor del hook.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // Total real de no leídas del usuario (lo devuelve la RPC): no se calcula
  // sobre el array cargado, que ahora es solo la porción scrolleada.
  const [unreadCount, setUnreadCount] = useState(0);
  const knownIds = useRef<Set<number>>(new Set());
  const loadingMoreRef = useRef(false);
  // Espejo de la lista para leerla dentro de los callbacks sin meterla como
  // dependencia (si no, el efecto de Realtime se re-suscribiría en cada carga).
  const itemsRef = useRef<Notification[]>([]);

  const applyItems = useCallback((next: Notification[]) => {
    itemsRef.current = next;
    setNotifications(next);
  }, []);

  // Primera página: refresca la cabecera del feed sin descartar las páginas ya
  // cargadas (el usuario puede tener el panel abierto y scrolleado cuando entra
  // un INSERT por Realtime): lo nuevo se antepone y el resto se conserva.
  const loadFirstPage = useCallback(async (notifyNew: boolean) => {
    try {
      const page = await getMyNotifications({ limit: NOTIFICATIONS_PAGE_SIZE });

      if (notifyNew) {
        page.items
          .filter((n) => !knownIds.current.has(n.id) && !n.isRead)
          .forEach((n) => toast(n.title, { description: n.message ?? undefined }));
      }

      const prev = itemsRef.current;
      const pageIds = new Set(page.items.map((n) => n.id));
      // Las de la página mandan (traen el is_read fresco); del resto se conserva
      // lo que ya se había paginado hacia abajo.
      const rest = prev.filter((n) => !pageIds.has(n.id));
      applyItems([...page.items, ...rest]);

      page.items.forEach((n) => knownIds.current.add(n.id));
      setUnreadCount(page.unreadCount);
      // Si ya había páginas cargadas, el hasMore vigente es el de la última
      // página pedida, no el de la primera.
      if (rest.length === 0) setHasMore(page.hasMore);
    } catch (error) {
      console.error('[notifications] error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [applyItems]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    const last = itemsRef.current[itemsRef.current.length - 1];
    if (!last) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getMyNotifications({
        limit: NOTIFICATIONS_PAGE_SIZE,
        beforeCreatedAt: last.createdAt,
        beforeId: last.id,
      });

      const existing = new Set(itemsRef.current.map((n) => n.id));
      applyItems([...itemsRef.current, ...page.items.filter((n) => !existing.has(n.id))]);
      page.items.forEach((n) => knownIds.current.add(n.id));
      setUnreadCount(page.unreadCount);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('[notifications] error al paginar notificaciones:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [applyItems]);

  useEffect(() => {
    if (!user) {
      applyItems([]);
      knownIds.current = new Set();
      setUnreadCount(0);
      setHasMore(false);
      return;
    }

    loadFirstPage(false);

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
          loadFirstPage(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFirstPage, applyItems]);

  const markAsRead = useCallback(async (id: number) => {
    const target = itemsRef.current.find((n) => n.id === id);
    if (target && !target.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    applyItems(
      itemsRef.current.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      ),
    );
    await markAsReadService(id);
  }, [applyItems]);

  const markAllAsRead = useCallback(async () => {
    setUnreadCount(0);
    applyItems(
      itemsRef.current.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
    );
    await markAllAsReadService();
  }, [applyItems]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
      }}
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
