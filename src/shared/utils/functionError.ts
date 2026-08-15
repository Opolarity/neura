/**
 * Extraccion del error real de una edge function.
 *
 * Cuando `supabase.functions.invoke` recibe un status != 2xx devuelve un
 * `FunctionsHttpError` cuyo `.message` es siempre el generico
 * "Edge Function returned a non-2xx status code". El cuerpo real de la respuesta
 * vive en `.context`, que es un `Response`: hay que leerlo con `await .json()`.
 *
 * OJO: `.context.body` NO sirve — es un ReadableStream, no un string ni un
 * objeto, asi que `JSON.parse` sobre el nunca devuelve el mensaje y el toast
 * termina mostrando el texto generico.
 *
 * Las edge functions responden `{ success:false, code?, error }` (ver
 * `supabase/functions/_shared/errors.ts` en neura-backend). `code` es el codigo
 * de negocio estable (p.ej. 'DUPLICATE_PRODUCT_TITLE') por si la UI necesita
 * reaccionar distinto en vez de solo mostrar el mensaje.
 */

export interface FunctionErrorBody {
  success?: boolean;
  code?: string;
  error?: unknown;
  message?: unknown;
  details?: unknown;
}

/** Error de edge function con el `code` de negocio adjunto, si el backend lo envio. */
export class FunctionError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FunctionError';
    this.code = code;
  }
}

/**
 * Lanza siempre. Usar como `if (error) await throwFunctionError(error);` justo
 * despues de un `supabase.functions.invoke`.
 */
export const throwFunctionError = async (error: unknown): Promise<never> => {
  const functionError = error as { context?: unknown };

  if (functionError?.context instanceof Response) {
    let body: FunctionErrorBody | null = null;
    try {
      body = await functionError.context.json();
    } catch {
      body = null;
    }

    const message = body?.error || body?.message || body?.details;
    if (message) {
      throw new FunctionError(String(message), body?.code);
    }
  }

  if (error instanceof Error) throw error;
  throw new Error('Error desconocido al llamar la función');
};
