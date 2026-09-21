import { supabase } from "@/integrations/supabase/client";

/**
 * Vínculo entre una orden de producción y sus servicios.
 *
 * Las dos operaciones van contra la MISMA edge function: el backend distingue
 * vincular de desvincular por la forma del cuerpo — `supplier_service_ids`
 * (lista) para lo primero, `supplier_service_id` (uno) para lo segundo.
 */
const LINK_ENDPOINT = "link-production-order-services";

/**
 * Engancha a la orden los servicios elegidos de una cotización.
 *
 * Lo que entra son SERVICIOS, no la cotización: se pueden mandar los de una
 * cotización ahora y los de otra después, y la orden acaba con los de varias.
 *
 * El SP aborta si alguno ya cuelga de otra orden -- su precio se contaría
 * entero en el costo de las dos.
 */
export const createServiceLinkApi = async (
  productionOrderId: number,
  serviceIds: number[]
): Promise<{ linked: number; skipped: number }> => {
  const { data, error } = await supabase.functions.invoke(LINK_ENDPOINT, {
    method: "POST",
    body: {
      production_order_id: productionOrderId,
      supplier_service_ids: serviceIds,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data?.data ?? { linked: 0, skipped: 0 };
};

/**
 * Quita un servicio de la orden.
 *
 * De uno en uno, que es como lo expone el backend: el SP borra antes las filas
 * de la matriz paso × prenda, o la FK lo impide.
 */
export const deleteServiceLinkApi = async (
  productionOrderId: number,
  serviceId: number
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke(LINK_ENDPOINT, {
    method: "POST",
    body: {
      production_order_id: productionOrderId,
      supplier_service_id: serviceId,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};
