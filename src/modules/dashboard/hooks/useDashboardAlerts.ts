import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import {
  franchiseModalPath,
  salesBySituationPath,
} from "@/modules/sales/utils/salesDeepLinks";
import {
  countPendingFranchisePayments,
  countPendingQuantityAdjustments,
  countSalesBySituation,
  fetchInProgressSituationId,
} from "../services/dashboardAlerts.service";

export interface DashboardAlert {
  key: "quantities" | "payments" | "in-progress";
  label: string;
  /** null si todavía no hay dato (primera carga) o la consulta falló. */
  count: number | null;
  path: string | null;
  /** Primera carga, sin nada en caché que mostrar. */
  loading: boolean;
  error: boolean;
}

interface AlertDefinition {
  key: DashboardAlert["key"];
  label: string;
  /** Permiso de la pantalla a la que lleva: sin él la alerta no se muestra. */
  permission: string;
  load: () => Promise<{ count: number; path: string | null }>;
}

const ALERTS: AlertDefinition[] = [
  {
    key: "quantities",
    label: "Cantidades por confirmar",
    permission: "sales_franchise.list",
    load: async () => ({
      count: await countPendingQuantityAdjustments(),
      path: franchiseModalPath("cantidades"),
    }),
  },
  {
    key: "payments",
    label: "Pagos por confirmar",
    permission: "sales_franchise.list",
    load: async () => ({
      count: await countPendingFranchisePayments(),
      path: franchiseModalPath("pagos"),
    }),
  },
  {
    key: "in-progress",
    label: "Ventas en proceso",
    permission: "sales.list",
    load: async () => {
      const situationId = await fetchInProgressSituationId();
      if (situationId == null) return { count: 0, path: null };
      return {
        count: await countSalesBySituation(situationId),
        path: salesBySituationPath(situationId),
      };
    },
  },
];

// Por usuario: tras cambiar de sesión no deben verse los conteos del anterior.
export const dashboardAlertQueryKey = (key: DashboardAlert["key"], userId?: string) =>
  ["dashboard-alerts", key, userId] as const;

export const useDashboardAlerts = () => {
  const { user, permissionCodes, permissionsLoading } = useAuth();
  const visible = permissionsLoading
    ? []
    : ALERTS.filter((alert) => permissionCodes.includes(alert.permission));

  // Una consulta por alerta: si una falla, las demás se muestran. Al volver al
  // dashboard se pinta lo que hay en caché y se refresca en segundo plano.
  const queries = useQueries({
    queries: visible.map((alert) => ({
      queryKey: dashboardAlertQueryKey(alert.key, user?.id),
      queryFn: alert.load,
      enabled: !!user?.id,
    })),
  });

  const alerts: DashboardAlert[] = visible.map(({ key, label }, i) => {
    const { data, isPending, isError } = queries[i];
    return {
      key,
      label,
      count: data?.count ?? null,
      path: data?.path ?? null,
      loading: isPending && !isError,
      error: isError && !data,
    };
  });

  return { alerts, loading: permissionsLoading };
};
