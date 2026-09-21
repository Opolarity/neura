/**
 * El IGV de una línea de compra: cómo se lee, no cuánto vale.
 *
 * El precio pactado es el dato y **no se toca nunca**: es lo que se acordó con
 * el proveedor y lo que aparecerá en su factura. Lo que decide el indicador es
 * qué cuentas enseña el papel a partir de ese mismo número.
 *
 * Hubo una versión que sí calculaba —cambiaba el precio guardado— y se retiró;
 * la migración 202610010079 dejó escrito por qué. Esto es lo contrario: el
 * precio se queda quieto y el desglose se deriva al imprimir.
 *
 * ## Los tres estados salen del booleano que ya existe
 *
 * `supplier_services.price_includes_tax` es nullable, así que da los
 * tres sin añadir nada al esquema: «no incluye» y «agregar IGV» no son dos
 * hechos distintos —el precio no lleva IGV— y lo único que cambia es que el
 * papel lo suma.
 *
 * ## La tasa
 *
 * Vive aquí para las compras. Ventas tiene la suya, repetida en `emit-invoice`,
 * `SalesInvoicesModal` y dos veces en `InvoicingStep`: el mismo 18 en cuatro
 * sitios. Unificarlos es otro cambio y toca código que ya emite a SUNAT, así
 * que por ahora este es el quinto, dicho a las claras en vez de escondido en
 * una división suelta.
 */

/** 18%, como en `emit-invoice`. */
export const IGV_RATE = 0.18;

/** Cómo se rotula el indicador de una línea. */
export const taxLabel = (includesTax: boolean | null | undefined): string =>
  includesTax === null || includesTax === undefined
    ? "Sin declarar"
    : includesTax
      ? "Incluye IGV"
      : "Más IGV";

/** El desglose de una línea, o null cuando no hay nada que desglosar. */
export interface TaxBreakdown {
  /** Base imponible. */
  base: number;
  igv: number;
  /** Lo que se le paga al proveedor. */
  total: number;
  /** Si el IGV salió de dentro del precio o se le sumó. */
  includesTax: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Qué enseñar de un importe según cómo se declaró.
 *
 * - **Incluye IGV**: el IGV se extrae de dentro, igual que `emit-invoice`
 *   (`base = total / 1.18`). El total es el precio pactado.
 * - **Más IGV**: el precio es la base y el IGV se le suma. El total sube.
 * - **Sin declarar**: null. No se asume ninguna de las dos, que es lo que se
 *   viene haciendo con todas las líneas anteriores al indicador.
 */
export const taxBreakdown = (
  amount: number | null | undefined,
  includesTax: boolean | null | undefined,
): TaxBreakdown | null => {
  if (amount === null || amount === undefined) return null;
  if (includesTax === null || includesTax === undefined) return null;

  if (includesTax) {
    const base = round2(amount / (1 + IGV_RATE));
    return { base, igv: round2(amount - base), total: round2(amount), includesTax };
  }

  const igv = round2(amount * IGV_RATE);
  return { base: round2(amount), igv, total: round2(amount + igv), includesTax };
};

/**
 * El desglose de un conjunto de líneas.
 *
 * Devuelve null si NINGUNA declara: un papel de líneas sin declarar se imprime
 * como hasta ahora, con su total y nada más. Las que no declaran entran al
 * total sin aportar IGV, que es lo unico que se sabe de ellas.
 */
export const taxBreakdownOf = (
  lines: Array<{ price: number | null; includesTax?: boolean | null }>,
): TaxBreakdown | null => {
  if (!lines.some((line) => line.includesTax !== null && line.includesTax !== undefined)) {
    return null;
  }

  let base = 0;
  let igv = 0;
  let total = 0;

  for (const line of lines) {
    const desglose = taxBreakdown(line.price, line.includesTax);
    if (desglose) {
      base += desglose.base;
      igv += desglose.igv;
      total += desglose.total;
    } else {
      base += line.price ?? 0;
      total += line.price ?? 0;
    }
  }

  return {
    base: round2(base),
    igv: round2(igv),
    total: round2(total),
    // Mixto se rotula como el conjunto: lo que importa abajo es el total.
    includesTax: lines.every((line) => line.includesTax === true),
  };
};
