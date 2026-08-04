export type NotificationType = 'info' | 'warning' | 'error' | 'success';

/** Forma cruda que devuelve la RPC sp_get_my_notifications (jsonb). */
export interface NotificationApi {
  id: number;
  title: string;
  message: string | null;
  type: string;
  module_id: number | null;
  module_code: string | null;
  entity_id: string | null;
  permission_codes: string[];
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

/** ViewModel de la UI. La notificación está ligada a permisos, no a un usuario;
 *  is_read/read_at se calculan por usuario (notification_reads). */
export interface Notification {
  id: number;
  title: string;
  message: string | null;
  type: NotificationType;
  moduleId: number | null;
  moduleCode: string | null;
  entityId: string | null;
  permissionCodes: string[];
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}
