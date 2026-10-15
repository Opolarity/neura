import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import type { Notification } from '../types/notification.types';
import { getNotificationPath } from '../utils/notificationRoutes';

const typeIcon = {
  info: <Info className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  error: <XCircle className="w-4 h-4 shrink-0" />,
  success: <CheckCircle className="w-4 h-4 shrink-0" />,
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
  /** Se invoca tras navegar por deep-link (para cerrar el popover). */
  onNavigate?: () => void;
}

export function NotificationItem({ notification, onRead, onNavigate }: NotificationItemProps) {
  const navigate = useNavigate();
  const { permissionCodes } = useAuth();

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const targetPath = getNotificationPath(notification, permissionCodes);

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (targetPath) {
      navigate(targetPath);
      onNavigate?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
    >
      <div className="mt-0.5">{typeIcon[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notification.isRead ? 'font-semibold' : 'font-medium text-foreground'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
      )}
    </button>
  );
}
