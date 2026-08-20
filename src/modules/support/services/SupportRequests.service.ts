import { supabase } from "@/integrations/supabase/client";
import { throwEdgeFunctionError } from "@/shared/services/edgeFunctionError";
import {
  SupportServiceError,
  type SupportAttachment,
  type SupportErrorCode,
  type SupportMessageApiResponse,
  type SupportRequestDetailApiResponse,
  type SupportRequestsApiResponse,
  type SupportRequestsFilters,
} from "../types/Support.types";

/**
 * Se apoya en el normalizador compartido (mismo contrato de las edge functions
 * puente con OPOLARITY Tasks) y solo aporta el mensaje de "no se llegó".
 */
const throwSupportFunctionError = (error: unknown): Promise<never> =>
  throwEdgeFunctionError(
    error,
    "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.",
  );

export const getSupportRequests = async (
  filters: SupportRequestsFilters,
): Promise<SupportRequestsApiResponse> => {
  const { data, error } = await supabase.functions.invoke("get-support-requests", {
    method: "POST",
    body: {
      // omitido = todas (tickets y sugerencias)
      request_type: filters.requestType ?? undefined,
      // Los tres filtros de la API externa son multi-valor; la vista maneja un
      // valor por filtro y "" es válido (solicitudes sin ese dato), así que la
      // condición mira el null y no el string vacío.
      reporter_names: filters.reporterName === null ? undefined : [filters.reporterName],
      statuses: filters.status === null ? undefined : [filters.status],
      origin_hosts: filters.originHost === null ? undefined : [filters.originHost],
      page: filters.page,
      page_size: filters.size,
    },
  });

  if (error) await throwSupportFunctionError(error);
  if (data?.error) {
    throw new SupportServiceError(
      String(data.error),
      (data.error_code as SupportErrorCode) ?? "upstream_error",
    );
  }

  return data as SupportRequestsApiResponse;
};

/**
 * Detalle de UNA solicitud. Se pide solo cuando el usuario la abre: trae la
 * descripción con sus imágenes, así que no se llama por cada fila del listado.
 */
export const getSupportRequest = async (
  id: string,
): Promise<SupportRequestDetailApiResponse> => {
  const { data, error } = await supabase.functions.invoke("get-support-request", {
    method: "POST",
    body: { id },
  });

  if (error) await throwSupportFunctionError(error);
  if (data?.error) {
    throw new SupportServiceError(
      String(data.error),
      (data.error_code as SupportErrorCode) ?? "upstream_error",
    );
  }

  return data as SupportRequestDetailApiResponse;
};

/**
 * Añade un mensaje al hilo de una solicitud. El nombre del autor lo resuelve la
 * edge function a partir del usuario autenticado: no se envía desde aquí.
 * La respuesta no trae la conversación completa: hay que volver a pedir el detalle.
 */
export const createSupportRequestMessage = async (
  suggestionId: string,
  content: string,
  attachments?: SupportAttachment[],
): Promise<SupportMessageApiResponse> => {
  const { data, error } = await supabase.functions.invoke(
    "create-support-request-message",
    {
      method: "POST",
      body: {
        suggestion_id: suggestionId,
        content,
        attachments:
          attachments && attachments.length > 0
            ? attachments.map((a) => ({
                file_name: a.fileName,
                mime_type: a.mimeType,
                content_base64: a.contentBase64,
              }))
            : undefined,
      },
    },
  );

  if (error) await throwSupportFunctionError(error);
  if (data?.error) {
    throw new SupportServiceError(
      String(data.error),
      (data.error_code as SupportErrorCode) ?? "upstream_error",
    );
  }

  return data as SupportMessageApiResponse;
};
