export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  module_id: number | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
