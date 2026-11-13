import { useMutation } from "@tanstack/react-query";
import { saveCashOnDelivery } from "../services/Couriers.service";
import type { CashOnDelivery } from "../types/Couriers.types";
import type { OrderCourier } from "../adapters/Couriers.adapter";
import { toastError } from "@/shared/utils/toastError";
import { orderCourierKey, useOrderCourier } from "./useOrderCourier";

export const useCashOnDelivery = (orderId: number | null) => {
  const { query, queryClient } = useOrderCourier(orderId);

  // Optimista: la casilla cambia al instante.
  const save = useMutation({
    mutationFn: (cod: CashOnDelivery) => saveCashOnDelivery(orderId!, cod.enabled),
    onMutate: (cod: CashOnDelivery) =>
      queryClient.setQueryData<OrderCourier>(orderCourierKey(orderId), (prev) =>
        prev ? { ...prev, cashOnDelivery: cod } : prev,
      ),
    // Solo se toma la marca: el resto del envío ya está en la caché.
    onSuccess: (data) =>
      queryClient.setQueryData<OrderCourier>(orderCourierKey(orderId), (prev) =>
        prev ? { ...prev, cashOnDelivery: data.cashOnDelivery } : data,
      ),
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: orderCourierKey(orderId) });
      toastError(error, "No se pudo guardar el cobro contra entrega");
    },
  });

  return {
    cod: query.data?.cashOnDelivery ?? null,
    saveCod: (cod: CashOnDelivery) => save.mutate(cod),
  };
};
