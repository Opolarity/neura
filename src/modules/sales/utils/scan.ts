// Utilidades para el escaneo de códigos de barras en los buscadores de productos.

/**
 * Dado el código escaneado y los resultados crudos de `get-sale-products`,
 * devuelve la coincidencia EXACTA o `null`.
 *
 * Soporta los dos formatos que puede tener una etiqueta:
 *  - NUEVO: el SKU de la variación (ej. "CAM-001-M").
 *  - ANTERIOR: "<variationId>-<lote>" (ej. "4826-1"). En este caso se ignora
 *    el lote (todo lo que sigue después del primer "-") y se busca por el id
 *    de la variación.
 *
 * El backend (`sp_get_sale_products`) ya resuelve el código escaneado hacia
 * `variation_id` (dígitos iniciales) y hace `sku ILIKE`, por lo que el fetch
 * con el código devuelve el/los candidatos. Aquí solo elegimos el exacto en
 * lugar de tomar `results[0]` a ciegas.
 *
 * Si más de un resultado matchea exactamente (ej. SKUs duplicados por un
 * problema de datos), se devuelve `null` en vez de elegir uno al azar: el
 * caller debe dejar la lista filtrada visible para que el usuario elija.
 */
export function findExactScanMatch<
  T extends { sku?: string; variationId: number },
>(code: string, results: T[]): T | null {
  const q = code.trim();
  if (!q) return null;

  // 1) Formato NUEVO: coincidencia exacta por SKU (case-insensitive).
  //    Se evalúa primero para no romper SKUs que contengan "-".
  const bySku = results.filter((r) => r.sku?.toLowerCase() === q.toLowerCase());
  if (bySku.length === 1) return bySku[0];
  if (bySku.length > 1) return null;

  // 2) Formato ANTERIOR "<variationId>-<lote>": se ignora el lote (lo que
  //    sigue después del primer "-") y se busca por id de variación.
  const idPart = q.split("-")[0].trim();
  if (/^\d+$/.test(idPart)) {
    const byId = results.filter((r) => r.variationId === Number(idPart));
    if (byId.length === 1) return byId[0];
    if (byId.length > 1) return null;
  }

  // 3) Si la búsqueda devolvió un único resultado, asumimos que es el buscado.
  return results.length === 1 ? results[0] : null;
}
