/**
 * Unica forma de volcar un error al toast.
 *
 * Decide entre el mensaje del backend y un texto controlado: si el SP mando un
 * mensaje pensado para el usuario ("Ya existe un producto con ese nombre") se
 * muestra tal cual; si lo que llego es ruido tecnico de Postgres o un literal de
 * relleno ("Internal server error"), se muestra el fallback y el detalle queda
 * en consola. El error crudo se loguea siempre, se muestre lo que se muestre.
 *
 * La decision del texto vive en `errorMessageOf` (functionError.ts), para que
 * tambien la pueda usar quien maneje el error sin toast.
 */
import { toast } from "@/shared/hooks/use-toast";
import { errorMessageOf } from "@/shared/utils/functionError";

export { errorMessageOf };

/**
 * @param fallback que decir si el error no trae nada presentable. Conviene el
 * literal que tenia antes ese catch ("No se pudo crear el usuario"), que da mas
 * contexto que el generico.
 */
export function toastError(
  error: unknown,
  fallback?: string,
  title = "Error",
): void {
  console.error(error);

  toast({
    title,
    description: errorMessageOf(error, fallback),
    variant: "destructive",
  });
}
