import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { NotificationItem } from "@/modules/notifications/components/NotificationItem";
import { AlertsCard } from "../components/AlertsCard";

const Dashboard = () => {
  const { companyShortName, companyShortNameLoading } = useAuth();
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
  } = useNotifications();

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

        {/* Alertas: lo que espera una acción, con enlace a donde se resuelve */}
        <AlertsCard />
      </div>
    </div>
  );
};

export default Dashboard;
