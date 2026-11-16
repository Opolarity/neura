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
  /** Destino explícito del click (S-103). Opcional: backend anterior no lo manda. */
  link_path?: string | null;
  /** Notificación personal, de un solo destinatario (S-103). */
  is_personal?: boolean;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

/** Página cruda que devuelve la RPC sp_get_my_notifications (jsonb). */
export interface NotificationsPageApi {
  items: NotificationApi[];
  has_more: boolean;
  unread_count: number;
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
  /** Ruta a la que lleva el click; null = se deriva de permissionCodes. */
  linkPath: string | null;
  /** Solo para el usuario de la sesión (ej: "soporte respondió tu ticket"). */
  isPersonal: boolean;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

/** Página de notificaciones ya adaptada. unreadCount es el total del usuario,
 *  no el de la página: el badge no depende de cuánto se haya scrolleado. */
export interface NotificationsPage {
  items: Notification[];
  hasMore: boolean;
  unreadCount: number;
}
