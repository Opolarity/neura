import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderCourier } from "../services/Couriers.service";
import type { OrderCourier } from "../adapters/Couriers.adapter";

export const orderCourierKey = (orderId: number | null) => ["order-courier", orderId];

/**
 * Envío con courier y contra entrega de la venta. Una sola consulta (incluye el
 * rastreo en vivo si hay guía) que comparten useCourierShipment y
 * useCashOnDelivery.
 */
export const useOrderCourier = (orderId: number | null) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: orderCourierKey(orderId),
    queryFn: () => getOrderCourier(orderId!),
    enabled: orderId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const setOrderCourier = (data: OrderCourier) =>
    queryClient.setQueryData(orderCourierKey(orderId), data);
  return { query, setOrderCourier, queryClient };
};
