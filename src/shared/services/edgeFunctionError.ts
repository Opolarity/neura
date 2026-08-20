/**
 * Normalizador de los errores de las edge functions que hacen de puente con
 * OPOLARITY Tasks (soporte y capacitaciones).
 *
 * Esas functions siguen un contrato propio: los errores de NEGOCIO viajan como
 * 200 + `{error, error_code}` —para que el `data?.error` de `functions.invoke`
 * los pueda mostrar tal cual— y solo los de INFRAESTRUCTURA salen con status
 * != 2xx, con el cuerpo dentro de `error.context`. Si no hay `Response`
 * siquiera, es que nunca se llegó a la función: offline, CORS, DNS o timeout.
 *
 * Vive en shared porque los dos módulos consumen el mismo contrato; tenerlo
 * duplicado es cómo se acaba con dos comportamientos distintos ante el mismo
 * error de la misma API.
 */

export type EdgeFunctionErrorCode =
  | "not_configured"
  | "unauthorized"
  | "invalid_api_key"
  | "client_not_found"
  | "company_document"
  | "bad_request"
  | "not_found"
  | "slot_taken"
  | "rate_limited"
  | "upstream_error"
  | "upstream_unreachable"
  | "server_config"
  | "network_error"
  | "unknown";

/** Error con código, para poder mostrar mensajes distintos dentro de la vista. */
export class EdgeFunctionError extends Error {
  code: EdgeFunctionErrorCode;

  constructor(message: string, code: EdgeFunctionErrorCode = "unknown") {
    super(message);
    this.name = "EdgeFunctionError";
    this.code = code;
  }
}

/**
 * Traduce el error de `supabase.functions.invoke` y lo lanza.
 *
 * @param networkMessage qué decirle al usuario cuando ni siquiera se llegó a
 * la función. Cambia por módulo ("servicio de soporte" / "de capacitaciones").
 */
export const throwEdgeFunctionError = async (
  error: unknown,
  networkMessage: string,
): Promise<never> => {
  const functionError = error as { context?: unknown; message?: string };

  if (functionError.context instanceof Response) {
    let body: { error?: unknown; error_code?: unknown } | null = null;
    try {
      body = await functionError.context.json();
    } catch {
      body = null;
    }

    if (body?.error) {
      throw new EdgeFunctionError(
        String(body.error),
        (body.error_code as EdgeFunctionErrorCode) ?? "unknown",
      );
    }

    throw new EdgeFunctionError(
      "El servicio respondió con un error inesperado.",
      "unknown",
    );
  }

  // Sin Response = nunca se llegó a la function (offline, CORS, DNS, timeout).
  throw new EdgeFunctionError(networkMessage, "network_error");
};
