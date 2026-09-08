import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type { TicketProtocolApiResponse } from "../types/Support.types";

/**
 * Texto del protocolo de respuestas de tickets, que vive en OPOLARITY y llega
 * por la edge function puente. Es solo lectura y no depende del usuario: el
 * mismo documento para toda la empresa.
 */
export const getTicketProtocol = async (): Promise<TicketProtocolApiResponse> =>
  invokeFunction<TicketProtocolApiResponse>("get-support-protocol", {
    method: "POST",
    networkMessage:
      "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.",
    body: {},
  });
