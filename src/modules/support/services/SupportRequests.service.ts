import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type {
  SupportAttachment,
  SupportMessageApiResponse,
  SupportRequestDetailApiResponse,
  SupportRequestsApiResponse,
  SupportRequestsFilters,
} from "../types/Support.types";

/**
 * Estas functions son puente con OPOLARITY Tasks: los errores de negocio llegan
 * como 200 + {error, error_code} y los de infraestructura con status != 2xx.
 * `invokeFunction` cubre los dos casos; aqui solo se aporta el mensaje de "no se
 * llego al servicio".
 */
const NETWORK_MESSAGE =
  "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.";

export const getSupportRequests = async (
  filters: SupportRequestsFilters,
): Promise<SupportRequestsApiResponse> =>
  invokeFunction<SupportRequestsApiResponse>("get-support-requests", {
    method: "POST",
    networkMessage: NETWORK_MESSAGE,
    body: {
      // omitido = todas (tickets y sugerencias)
      request_type: filters.requestType ?? undefined,
      // Los tres filtros de la API externa son multi-valor; la vista maneja un
      // valor por filtro y "" es válido (solicitudes sin ese dato), así que la
      // condición mira el null y no el string vacío.
      reporter_names: filters.reporterName === null ? undefined : [filters.reporterName],
      statuses: filters.status === null ? undefined : [filters.status],
      origin_hosts: filters.originHost === null ? undefined : [filters.originHost],
      // Omitido cuando está vacío: un término en blanco no es una búsqueda
      search: filters.search.trim() || undefined,
      page: filters.page,
      page_size: filters.size,
    },
  });

/**
 * Detalle de UNA solicitud. Se pide solo cuando el usuario la abre: trae la
 * descripción con sus imágenes, así que no se llama por cada fila del listado.
 */
export const getSupportRequest = async (
  id: string,
): Promise<SupportRequestDetailApiResponse> =>
  invokeFunction<SupportRequestDetailApiResponse>("get-support-request", {
    method: "POST",
    networkMessage: NETWORK_MESSAGE,
    body: { id },
  });

/**
 * Añade un mensaje al hilo de una solicitud. El nombre del autor lo resuelve la
 * edge function a partir del usuario autenticado: no se envía desde aquí.
 * La respuesta no trae la conversación completa: hay que volver a pedir el detalle.
 */
export const createSupportRequestMessage = async (
  suggestionId: string,
  content: string,
  attachments?: SupportAttachment[],
): Promise<SupportMessageApiResponse> =>
  invokeFunction<SupportMessageApiResponse>("create-support-request-message", {
    method: "POST",
    networkMessage: NETWORK_MESSAGE,
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
  });
