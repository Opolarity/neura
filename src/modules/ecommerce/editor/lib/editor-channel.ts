/**
 * Canal (tabla `channels`) sobre el que trabaja el editor visual.
 *
 * La tienda identifica su canal con la cabecera `x-channel-code`
 * (NEXT_PUBLIC_CHANNEL_CODE de cada despliegue). Desde el ERP el canal se elige
 * en pantalla y viaja en dos cabeceras: `x-channel-id` para ec-visual-edits
 * (entrada ERP, con el JWT del usuario) y `x-channel-code` para las funciones
 * de catálogo, que ya lo usan con la tienda.
 *
 * Es un valor de módulo y no de React porque lo leen funciones sueltas
 * (`editor-store`, `tienda/api`) que los bloques llaman sin contexto. Lo fija la
 * página (dashboard o editor) a partir del `?canal=` de la URL.
 */
let canalActual: number | null = null;
let codigoActual: string | null = null;

export function setEditorChannelId(id: number | null, code: string | null = null): void {
  canalActual = id;
  codigoActual = code;
}

export function getEditorChannelId(): number | null {
  return canalActual;
}

/** Cabecera que piden ec-visual-edits y las funciones de catálogo desde el ERP. */
export function editorChannelHeaders(): Record<string, string> {
  if (canalActual === null) {
    throw new Error("No hay un canal del ecommerce seleccionado");
  }
  return {
    "x-channel-id": String(canalActual),
    ...(codigoActual ? { "x-channel-code": codigoActual } : {}),
  };
}

/** Ruta del editor de una página, conservando el canal. */
export function editorPagePath(slug: string): string {
  const ruta = `/ecommerce/editor/${encodeURIComponent(slug)}`;
  return canalActual === null ? ruta : `${ruta}?canal=${canalActual}`;
}

/** Ruta del listado conservando el canal. */
export function editorDashboardPath(): string {
  return canalActual === null ? "/ecommerce/editor" : `/ecommerce/editor?canal=${canalActual}`;
}
