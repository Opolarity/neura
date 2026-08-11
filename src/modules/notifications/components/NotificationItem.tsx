import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { Notification } from '../types/notification.types';
import { getNotificationPath } from '../utils/notificationRoutes';

const typeIcon = {
  info: <Info className="w-4 h-4 text-info shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
  error: <XCircle className="w-4 h-4 text-destructive shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-success shrink-0" />,
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
      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
        !notification.isRead ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="mt-0.5">{typeIcon[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notification.isRead ? 'font-semibold' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
      )}
    </button>
  );
}
