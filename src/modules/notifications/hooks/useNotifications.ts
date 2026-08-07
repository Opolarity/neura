import { useNotificationsContext } from '../context/NotificationsProvider';

// El estado vive en NotificationsProvider (montado en App); este hook queda
// como punto de consumo para Header, Dashboard y cualquier otra vista.
export function useNotifications() {
  return useNotificationsContext();
}
