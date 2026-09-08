/**
 * Unica puerta a las edge functions.
 *
 * Existia ya un helper para sacar el mensaje real del error (`throwFunctionError`),
 * pero usarlo era opcional: lo aplicaban 4 de los 56 archivos que llamaban a
 * `functions.invoke`. Mientras el acceso directo siga siendo posible, cada
 * archivo nuevo vuelve a introducir el toast generico, asi que el arreglo no es
 * otro helper sino quitar el camino: aqui se envuelve la llamada, se normaliza
 * el error SIEMPRE y una regla de ESLint prohibe `functions.invoke` fuera de
 * este archivo.
 *
 * `.from()` y `.rpc()` NO pasan por aqui a proposito: los selects siguen
 * llamando a Supabase directo.
 *
 * Devuelve `data` tal cual, sin desempaquetar nada, para que los adapters que ya
 * existen reciban exactamente lo que recibian antes.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  functionErrorFromBody,
  NETWORK_ERROR_MESSAGE,
  throwFunctionError,
  type FunctionErrorBody,
} from "@/shared/utils/functionError";

type SupabaseInvokeOptions = NonNullable<
  Parameters<typeof supabase.functions.invoke>[1]
>;

export interface InvokeFunctionOptions extends SupabaseInvokeOptions {
  /**
   * Que mostrar si no se llego siquiera a la function (offline, CORS, DNS,
   * timeout). Por defecto un mensaje de conectividad generico.
   */
  networkMessage?: string;
}

/**
 * Invoca una edge function y devuelve su `data`. Lanza `FunctionError` con el
 * mensaje real del backend y, si lo hay, su `code` de negocio.
 *
 * @param name nombre de la function; admite querystring (`buildEndpoint`).
 */
// El default es `any`, igual que `functions.invoke<T = any>`: cambiarlo a
// `unknown` obligaria a anotar las 139 llamadas y no aporta seguridad real
// mientras los adapters sigan tipando la respuesta aguas abajo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function invokeFunction<T = any>(
  name: string,
  options?: InvokeFunctionOptions,
): Promise<T> {
  const { networkMessage, ...invokeOptions } = options ?? {};

  const { data, error } = await supabase.functions.invoke<T>(name, invokeOptions);

  if (error) {
    await throwFunctionError(error, networkMessage ?? NETWORK_ERROR_MESSAGE);
  }

  // Contrato 200-con-error: las functions puente con OPOLARITY Tasks (soporte y
  // capacitaciones) mandan los errores de negocio con status 200 y el cuerpo en
  // { error, error_code }; sin esto pasarian por exito.
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const body = data as FunctionErrorBody;
    const hasErrorText =
      typeof body.error === "string" && body.error.trim() !== "";

    if (body.success === false || hasErrorText) {
      throw functionErrorFromBody(body);
    }
  }

  return data as T;
}
