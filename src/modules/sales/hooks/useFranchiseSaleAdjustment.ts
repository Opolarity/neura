import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustFranchiseSale,
  fetchFranchiseLineSales,
} from "../services/FranchiseSaleAdjustment.service";

export const useFranchiseSaleAdjustment = (orderProductId: number | null) => {
  const queryClient = useQueryClient();
  const queryKey = ["franchise_line_sales", orderProductId];

  const sales = useQuery({
    queryKey,
    queryFn: () => fetchFranchiseLineSales(orderProductId!),
    enabled: orderProductId !== null,
    // El estado de pago cambia en el ERP del franquiciado: siempre se relee.
    staleTime: 0,
    gcTime: 0,
  });

  const adjust = useMutation({
    mutationFn: adjustFranchiseSale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { sales, adjust };
};
