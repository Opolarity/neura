import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  Loader2,
  PackageCheck,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardAlerts, type DashboardAlert } from "../hooks/useDashboardAlerts";

const alertIcon: Record<DashboardAlert["key"], JSX.Element> = {
  quantities: <PackageCheck className="w-4 h-4 text-gray-500 shrink-0" />,
  payments: <Wallet className="w-4 h-4 text-gray-500 shrink-0" />,
  "in-progress": <Clock className="w-4 h-4 text-gray-500 shrink-0" />,
};

export function AlertsCard() {
  const navigate = useNavigate();
  const { alerts, loading } = useDashboardAlerts();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TriangleAlert className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Alertas</h3>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <ShieldCheck className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay alertas disponibles</p>
          </div>
        ) : (
          <div>
            {alerts.map((alert) => (
              <button
                key={alert.key}
                type="button"
                disabled={!alert.path}
                onClick={() => alert.path && navigate(alert.path)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 disabled:cursor-default disabled:hover:bg-transparent"
              >
                {alertIcon[alert.key]}
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">
                  {alert.label}
                </span>
                {alert.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : alert.count === null ? (
                  <span className="text-sm text-gray-400" title="No se pudo cargar">
                    —
                  </span>
                ) : (
                  <Badge variant={alert.count > 0 ? "warning" : "secondary"}>
                    {alert.count}
                  </Badge>
                )}
                {alert.path && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
