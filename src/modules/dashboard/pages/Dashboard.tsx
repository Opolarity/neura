import React from "react";
import { formatDateTime } from "@/shared/utils/date";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Clock, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { NotificationItem } from "@/modules/notifications/components/NotificationItem";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  // El último inicio de sesión ya viene en el usuario de la sesión: pedirlo con
  // auth.getUser() era un round-trip a /auth/v1/user para un dato que el
  // AuthProvider ya tiene en memoria.
  const { user, loading, companyShortName, companyShortNameLoading } = useAuth();
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
  } = useNotifications();
  const lastSignIn = user?.last_sign_in_at ?? null;

  // La fecha absoluta va por formatDateTime, que resuelve en Lima. Con
  // `format()` de date-fns se pintaba en el huso del navegador. Lo relativo
  // ("hace 3 horas") es una duracion y no depende de la zona, asi que se queda
  // con date-fns.
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: formatDateTime(dateStr),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
        <p className="text-gray-600">
          Bienvenido al ERP de {companyShortNameLoading ? "..." : companyShortName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Notificaciones</h3>
            </div>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <BellOff className="w-10 h-10 mb-3" />
                <p className="text-sm">No hay notificaciones disponibles</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 5).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos inicios de sesión */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Últimos inicios de sesión</h3>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !lastSignIn ? (
              <p className="text-sm text-gray-400 italic py-4">
                No hay registro de inicio de sesión
              </p>
            ) : (
              <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(lastSignIn).full}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(lastSignIn).relative}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
