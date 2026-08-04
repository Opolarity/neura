import type { Notification, NotificationApi, NotificationType } from '../types/notification.types';

const VALID_TYPES: NotificationType[] = ['info', 'warning', 'error', 'success'];

export function adaptNotification(raw: NotificationApi): Notification {
  return {
    id: Number(raw.id),
    title: raw.title ?? '',
    message: raw.message ?? null,
    type: VALID_TYPES.includes(raw.type as NotificationType)
      ? (raw.type as NotificationType)
      : 'info',
    moduleId: raw.module_id ?? null,
    moduleCode: raw.module_code ?? null,
    entityId: raw.entity_id ?? null,
    permissionCodes: raw.permission_codes ?? [],
    createdAt: raw.created_at,
    isRead: !!raw.is_read,
    readAt: raw.read_at ?? null,
  };
}

export function adaptNotifications(raw: unknown): Notification[] {
  if (!Array.isArray(raw)) return [];
  return (raw as NotificationApi[]).map(adaptNotification);
}
