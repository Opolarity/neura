import { supabase } from "@/integrations/supabase/client";
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
 * La edge function devuelve los errores de negocio como 200 + {error, error_code}
 * y los de infraestructura con status != 2xx (el body viaja en error.context).
 */
const throwSupportFunctionError = async (error: unknown): Promise<never> => {
  const functionError = error as { context?: unknown; message?: string };

  if (functionError.context instanceof Response) {
    let body: { error?: unknown; error_code?: unknown } | null = null;
    try {
      body = await functionError.context.json();
    } catch {
      body = null;
    }

    if (body?.error) {
      throw new SupportServiceError(
        String(body.error),
        (body.error_code as SupportErrorCode) ?? "unknown",
      );
    }

    throw new SupportServiceError(
      "El servicio de soporte respondió con un error inesperado.",
      "unknown",
    );
  }

  // Sin Response = nunca se llegó a la function (offline, CORS, DNS, timeout).
  throw new SupportServiceError(
    "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.",
    "network_error",
  );
};

export const getSupportRequests = async (
  filters: SupportRequestsFilters,
): Promise<SupportRequestsApiResponse> => {
  const { data, error } = await supabase.functions.invoke("get-support-requests", {
    method: "POST",
    body: {
      // omitido = todas (tickets y sugerencias)
      request_type: filters.requestType ?? undefined,
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
