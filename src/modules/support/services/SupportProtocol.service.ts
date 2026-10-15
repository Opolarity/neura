import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type {
  TicketProtocolApiResponse,
  TicketProtocolEnvelope,
} from "../types/Support.types";

/**
 * Texto del protocolo de respuestas de tickets, que vive en OPOLARITY y llega
 * por la edge function puente. Es solo lectura y no depende del usuario: el
 * mismo documento para toda la empresa.
 *
 * La function responde `{ data: documento }` e `invokeFunction` no desempaqueta
 * nada, así que se saca aquí: el adapter recibe el documento plano.
 */
export const getTicketProtocol = async (): Promise<TicketProtocolApiResponse> => {
  const response = await invokeFunction<TicketProtocolEnvelope>("get-support-protocol", {
    method: "POST",
    networkMessage:
      "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.",
    body: {},
  });

  if (!response?.data) {
    throw new Error("La respuesta del protocolo de tickets llegó sin documento.");
  }

  return response.data;
};
