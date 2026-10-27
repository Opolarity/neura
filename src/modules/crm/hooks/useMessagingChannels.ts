import { useEffect, useMemo, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { getActiveSaleTypesApi } from "../services/messaging.service";
import type { MessagingChannel, MessagingSaleType } from "../types/messaging.types";
import { CHANNELS } from "../utils/channels";
import { useMessagingSettings } from "./useMessagingSettings";

/**
 * Lo que muestra Canales de mensajería: cada red con su estado y su canal de
 * venta, más los canales de venta activos para elegir. Cuál le toca a cada red
 * (elegido o deducido) lo resuelve el backend: fn_crm_network_sale_types, la
 * misma fuente que usan Pedido y los reportes.
 */
export const useMessagingChannels = () => {
  const messaging = useMessagingSettings();
  const [saleTypes, setSaleTypes] = useState<MessagingSaleType[]>([]);

  useEffect(() => {
    getActiveSaleTypesApi()
      .then(setSaleTypes)
      .catch((error) => toastError(error, "No se pudieron cargar los canales de venta"));
  }, []);

  const channels = useMemo<MessagingChannel[]>(
    () =>
      CHANNELS.map((network) => {
        const n = messaging.settings?.networks.find((x) => x.network === network);
        return {
          network,
          // WhatsApp: si existe su canal. Facebook e Instagram: si hay una
          // cuenta conectada. TikTok espera la aprobación de su API.
          status: messaging.connectedNetworks.includes(network) ? "connected" : "not_connected",
          saleTypeId: n?.saleTypeId ?? null,
          saleTypeName: n?.saleTypeName ?? null,
          configured: n?.configured ?? false,
          botEnabled: n?.botEnabled ?? false,
        };
      }),
    [messaging.settings, messaging.connectedNetworks]
  );

  return { ...messaging, channels, saleTypes };
};
