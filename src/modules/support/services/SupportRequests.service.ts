import { supabase } from "@/integrations/supabase/client";
import {
  SupportServiceError,
  type SupportErrorCode,
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
