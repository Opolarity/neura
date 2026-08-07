import { supabase } from '@/integrations/supabase/client';
import { adaptNotificationsPage } from '../adapters/notifications.adapter';
import type { NotificationsPage } from '../types/notification.types';

// La tabla notifications ya no se consulta directo: la visibilidad por
// permisos y el estado leído/no leído (notification_reads) los resuelven las
// RPCs SECURITY DEFINER.

export interface GetMyNotificationsParams {
  limit: number;
  /** Cursor keyset: última notificación ya cargada. Omitir para la 1ra página. */
  beforeCreatedAt?: string | null;
  beforeId?: number | null;
}

export async function getMyNotifications({
  limit,
  beforeCreatedAt = null,
  beforeId = null,
}: GetMyNotificationsParams): Promise<NotificationsPage> {
  const { data, error } = await supabase.rpc('sp_get_my_notifications', {
    p_limit: limit,
    p_before_created_at: beforeCreatedAt,
    p_before_id: beforeId,
  });
  if (error) throw error;
  return adaptNotificationsPage(data);
}

export async function markAsRead(id: number): Promise<void> {
  const { error } = await supabase.rpc('sp_mark_notification_read', {
    p_notification_id: id,
  });
  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase.rpc('sp_mark_all_notifications_read');
  if (error) throw error;
}
