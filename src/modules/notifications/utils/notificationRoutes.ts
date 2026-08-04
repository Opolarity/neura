import { APP_PERMISSIONS_CONFIG, getRoutes } from '@/app/data/permissions';
import type { Notification } from '../types/notification.types';

// Mapa code -> path derivado de la config de permisos, para que el deep-link
// no se desincronice de las rutas reales. Solo rutas sin parámetros: las que
// llevan ':id' exigen conocer el shape del parámetro y no aplican como
// destino genérico de una notificación.
const routeByCode = new Map(
  getRoutes(APP_PERMISSIONS_CONFIG)
    .filter((route) => !route.path.includes(':'))
    .map((route) => [route.code, route.path]),
);

/**
 * Ruta destino de una notificación: el path del primer permission code que el
 * usuario tenga. Como el backend ya filtró por permisos, normalmente el
 * primero matchea; si ninguno tiene ruta navegable devuelve null y el click
 * solo marca como leída.
 */
export function getNotificationPath(
  notification: Notification,
  userPermissionCodes: string[],
): string | null {
  for (const code of notification.permissionCodes) {
    const path = routeByCode.get(code);
    if (path && userPermissionCodes.includes(code)) return path;
  }
  return null;
}
