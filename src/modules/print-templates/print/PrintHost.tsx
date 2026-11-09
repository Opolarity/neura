import { lazy, Suspense, useSyncExternalStore } from "react";
import { printQueue } from "./printDocument";

// El editor (craft, los componentes, los diseños) se carga al imprimir.
const PrintJobRunner = lazy(() => import("./PrintJobRunner"));

/**
 * Lo que imprime printDocument: uno a la vez. Va una vez en App, dentro de
 * la sesión (los Textos de la Configuración leen sus parámetros).
 */
export function PrintHost() {
  const request = useSyncExternalStore(
    printQueue.subscribe,
    printQueue.current,
  );
  if (!request) return null;
  return (
    <Suspense fallback={null}>
      <PrintJobRunner key={request.id} request={request} />
    </Suspense>
  );
}
