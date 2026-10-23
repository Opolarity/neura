import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveParameters } from "@/modules/settings/services/Parameters.service";
import { fetchFranchiseStockValue } from "../services/FranchiseStock.service";
import { franchiseStockLimitParam } from "../types/FranchiseStock.types";

/**
 * T-593: resumen valorizado del franquiciado elegido y edición de su tope.
 * El tope es informativo (decisión de Diego): no bloquea envíos ni ventas.
 */
export const useFranchiseStockValue = (tenantReference: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ["franchise_stock_value", tenantReference];

  const value = useQuery({
    queryKey,
    queryFn: () => fetchFranchiseStockValue(tenantReference!),
    enabled: !!tenantReference,
    staleTime: 1000 * 60 * 5,
  });

  const saveLimit = useMutation({
    mutationFn: (limit: number | null) =>
      saveParameters({
        [franchiseStockLimitParam(tenantReference!)]: limit === null ? "" : String(limit),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { value, saveLimit };
};
