import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Clock, LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getParameter } from "@/modules/settings/services/Parameters.service";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const [companyName, setCompanyName] = useState("");
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      getParameter("CompanyShortName").then(setCompanyName);

      const { data: { user } } = await supabase.auth.getUser();
      setLastSignIn(user?.last_sign_in_at ?? null);
      setLoading(false);
    };
    init();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: format(date, "dd MMM yyyy, HH:mm", { locale: es }),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
        <p className="text-gray-600">Bienvenido al ERP de {companyName}</p>
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
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <BellOff className="w-10 h-10 mb-3" />
              <p className="text-sm">No hay notificaciones disponibles</p>
            </div>
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
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
