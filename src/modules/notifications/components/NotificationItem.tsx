import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Notification } from '../types/notification.types';

const typeIcon = {
  info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <button
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="mt-0.5">{typeIcon[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notification.is_read ? 'font-semibold' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
      )}
    </button>
  );
}
