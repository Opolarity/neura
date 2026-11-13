/**
 * Lee lo escrito en un campo numérico. Devuelve null si no es un número válido (texto,
 * negativo, vacío). Con `decimals` > 0 redondea a esa cantidad de decimales, desde la
 * mitad hacia arriba (0.025 → 0.03); con `integer` no acepta decimales.
 */
export function parseNumberInput(text: string, opts: { decimals?: number; integer?: boolean } = {}): number | null {
  const t = text.trim();
  const pattern = opts.integer ? /^\d+$/ : /^(\d+(\.\d*)?|\.\d+)$/;
  if (!pattern.test(t)) return null;
  if (opts.integer) return Number(t);
  const decimals = opts.decimals ?? 2;
  // Redondeo sobre la notación decimal ("0.025e2" = 2.5 exacto), no sobre el binario
  // (0.025 * 100 = 2.4999…), para que la mitad suba siempre.
  const n = Number(`${Math.round(Number(`${t}e${decimals}`))}e-${decimals}`);
  return Number.isFinite(n) ? n : null;
}
