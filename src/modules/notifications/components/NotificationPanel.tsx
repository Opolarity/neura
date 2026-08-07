import { useCallback, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export function NotificationPanel() {
  const { notifications, unreadCount, hasMore, loadingMore, loadMore, markAsRead, markAllAsRead } =
    useNotifications();
  // Controlado para poder cerrarlo al navegar por deep-link desde un item.
  const [open, setOpen] = useState(false);

  // El scroll ocurre dentro del viewport de Radix, no en la ventana: ese nodo
  // debe ser el root del observer o el sentinel nunca "entra en pantalla".
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const scrollAreaRef = useCallback((node: HTMLDivElement | null) => {
    setViewport(
      node?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]') ?? null,
    );
  }, []);

  const sentinelRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: open && hasMore && !!viewport,
    root: viewport,
    rootMargin: '80px',
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700 h-auto py-0.5 px-2"
              onClick={markAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No tienes notificaciones
          </div>
        ) : (
          // Altura FIJA (no max-h): el viewport h-full de Radix necesita una
          // caja de referencia para producir scroll real; sin eso no hay
          // scroll infinito posible.
          <ScrollArea ref={scrollAreaRef} className="h-[400px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onNavigate={() => setOpen(false)}
              />
            ))}

            {hasMore && <div ref={sentinelRef} className="h-px" />}

            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
