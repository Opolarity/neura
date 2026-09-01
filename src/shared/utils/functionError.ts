/**
 * Contrato unico de errores de edge function.
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
 * Las edge functions del backend no responden todas igual. Sobre las 108 que
 * invoca el ERP conviven cuatro formas de cuerpo:
 *   84  { error }
 *   16  { success:false, error }
 *    6  { error:'Internal server error', details:'<mensaje real>' }
 *    2  { success:false, code?, error }   <- el contrato bueno, `_shared/errors.ts`
 * Por eso `resolveErrorMessage` no puede ser `error || message || details`: en
 * el tercer grupo —que son create-order, create-invoice, create-movements,
 * create-stock-movements-entrance, update-order y update-invoice— `error` es
 * truthy pero no dice nada, y el mensaje real esta en `details`.
 *
 * Aparte, las functions puente con OPOLARITY Tasks (soporte y capacitaciones)
 * mandan los errores de NEGOCIO como 200 + { error, error_code } y solo los de
 * INFRAESTRUCTURA con status != 2xx. Ese caso lo cubre `invokeFunction`, que
 * mira `data` ademas de `error`; aqui solo se acepta `error_code` como alias de
 * `code` para que ambos contratos produzcan el mismo `FunctionError`.
 *
 * Este modulo no se usa directo: se llega a el por
 * `@/integrations/supabase/invokeFunction`.
 */

export interface FunctionErrorBody {
  success?: boolean;
  code?: string;
  error_code?: string;
  error?: unknown;
  message?: unknown;
  details?: unknown;
}

/**
 * Codigos conocidos. La union esta abierta a proposito: los codigos de negocio
 * los define el backend via HINT del SP (p.ej. 'DUPLICATE_PRODUCT_TITLE') y no
 * tiene sentido mantener aqui una lista que se quede corta.
 */
export type FunctionErrorCode =
  | "network_error"
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
  | "unknown"
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

/** Lo que se muestra cuando lo que llego no es presentable al usuario. */
export const GENERIC_ERROR_MESSAGE =
  "No se pudo completar la operación. Intenta nuevamente.";

/** Lo que se muestra cuando nunca se llego a la function. */
export const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.";

/**
 * Literales de relleno del backend. No son mensajes: son lo que queda cuando el
 * `catch` de la edge function perdio el error real. Hay 53 repartidos entre las
 * 237 functions.
 */
const PLACEHOLDER_MESSAGES = [
  "error desconocido",
  "error desconocido.",
  "internal server error",
  "unknown error",
  "error desconocido al llamar la función",
  "edge function returned a non-2xx status code",
];

/**
 * Ruido de Postgres/PostgREST. Llega cuando revienta algo que el SP no previo,
 * y no debe verse en pantalla: el usuario no puede hacer nada con
 * "duplicate key value violates unique constraint".
 */
const TECHNICAL_PATTERNS: RegExp[] = [
  /duplicate key value/i,
  /violates .*constraint/i,
  /relation ".*" does not exist/i,
  /column .* does not exist/i,
  /function .* does not exist/i,
  /permission denied for/i,
  /null value in column/i,
  /invalid input syntax/i,
  /^PGRST/i,
  /\bJWT\b/,
  /stack overflow/i,
];

const isPlaceholder = (message: string): boolean =>
  PLACEHOLDER_MESSAGES.includes(message.trim().toLowerCase());

/**
 * True si el texto no es apto para mostrarse al usuario: vacio, de relleno o
 * ruido tecnico. Lo consume `toastError` para decidir entre el mensaje del
 * backend y `GENERIC_ERROR_MESSAGE`.
 */
export const isTechnicalMessage = (message: unknown): boolean => {
  if (typeof message !== "string") return true;
  const text = message.trim();
  if (!text) return true;
  if (isPlaceholder(text)) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
};

/**
 * Saca el mensaje util del cuerpo de error, mirando `error`, `message` y
 * `details` en ese orden pero **saltando los de relleno**: por eso las 6
 * functions que responden `{ error:'Internal server error', details }` acaban
 * mostrando `details` y no el literal.
 */
export const resolveErrorMessage = (
  body: FunctionErrorBody | null | undefined,
): string | null => {
  if (!body) return null;

  const texts = [body.error, body.message, body.details]
    .filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    )
    .map((value) => String(value).trim())
    .filter(Boolean);

  return texts.find((text) => !isPlaceholder(text)) ?? texts[0] ?? null;
};

/** Error de edge function con el `code` de negocio adjunto, si el backend lo envio. */
export class FunctionError extends Error {
  readonly code?: FunctionErrorCode;

  /**
   * Cuerpo tal cual lo devolvio la function. Casi nadie lo necesita —para
   * mostrar basta `message`—, pero alguna respuesta trae campos estructurados
   * que la pantalla usa: `crm-send-message` manda `reason` y `takenByName` para
   * distinguir "no se pudo enviar" de "la conversacion la tomó otro". Adjuntarlo
   * aqui evita tener que abrirle una excepcion al chokepoint.
   */
  readonly body?: FunctionErrorBody;

  constructor(
    message: string,
    code?: FunctionErrorCode,
    body?: FunctionErrorBody,
  ) {
    super(message);
    this.name = "FunctionError";
    this.code = code;
    this.body = body;
  }
}

/** Construye el `FunctionError` de un cuerpo ya parseado (contrato 200 + {error}). */
export const functionErrorFromBody = (
  body: FunctionErrorBody | null | undefined,
): FunctionError =>
  new FunctionError(
    resolveErrorMessage(body) ?? GENERIC_ERROR_MESSAGE,
    body?.code ?? body?.error_code,
    body ?? undefined,
  );

/**
 * El texto que se le mostraria al usuario. Vive aqui —y no en `toastError`—
 * para que lo pueda usar quien maneje el error sin toast.
 */
export const errorMessageOf = (error: unknown, fallback?: string): string => {
  // Con code de negocio el mensaje es deliberado: se respeta sin filtrar.
  if (error instanceof FunctionError && error.code && error.message) {
    return error.message;
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : null;

  if (raw && !isTechnicalMessage(raw)) return raw;

  return fallback ?? GENERIC_ERROR_MESSAGE;
};

/**
 * Lanza siempre. No llamarla suelta: la usa `invokeFunction`, que es la unica
 * puerta a las edge functions.
 *
 * @param networkMessage que decirle al usuario cuando ni siquiera se llego a la
 * function (offline, CORS, DNS, timeout). Algunos modulos lo personalizan
 * ("servicio de soporte" / "de capacitaciones").
 */
export const throwFunctionError = async (
  error: unknown,
  networkMessage: string = NETWORK_ERROR_MESSAGE,
): Promise<never> => {
  const functionError = error as { context?: unknown };

  if (functionError?.context instanceof Response) {
    let body: FunctionErrorBody | null = null;
    try {
      // clone(): el body de una Response se lee una sola vez, y asi nadie mas
      // se queda sin el si vuelve a mirarlo.
      body = await functionError.context.clone().json();
    } catch {
      body = null;
    }

    throw functionErrorFromBody(body);
  }

  if (error instanceof FunctionError) throw error;

  // Sin Response = nunca se llego a la function.
  throw new FunctionError(networkMessage, "network_error");
};
