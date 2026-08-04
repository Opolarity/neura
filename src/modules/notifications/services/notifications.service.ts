import { supabase } from '@/integrations/supabase/client';
import { adaptNotifications } from '../adapters/notifications.adapter';
import type { Notification } from '../types/notification.types';

// La tabla notifications ya no se consulta directo: la visibilidad por
// permisos y el estado leído/no leído (notification_reads) los resuelven las
// RPCs SECURITY DEFINER.

export async function getMyNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.rpc('sp_get_my_notifications');
  if (error) throw error;
  return adaptNotifications(data);
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
