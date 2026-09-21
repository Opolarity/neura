/**
 * Utilidades para formateo de moneda
 */

/**
 * Formatea un número como moneda peruana (S/)
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) return "S/ 0.00";
  const absAmount = Math.abs(amount).toFixed(2);
  return amount < 0 ? `-S/ ${absAmount}` : `S/ ${absAmount}`;
};

/**
 * Formatea un número como moneda usando Intl (más completo)
 */
export const formatCurrencyIntl = (
  amount: number,
  currency: string = "PEN",
  locale: string = "es-PE"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Parsea un string de moneda a número
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
};

const SIMBOLOS: Record<string, string> = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
};

export const currencySymbol = (currency: string | null | undefined): string => {
  const codigo = (currency ?? "PEN").toUpperCase();
  return SIMBOLOS[codigo] ?? codigo;
};

/**
 * Un importe con su moneda, para los papeles del proveedor.
 *
 * Vive aqui y no en cada documento para que la Orden de Servicio y la de
 * Compra no puedan discrepar: al mismo proveedor se le mandan las dos.
 */
export const formatDocumentMoney = (
  value: number | null | undefined,
  currency: string | null | undefined,
): string =>
  value === null || value === undefined
    ? "—"
    : `${currencySymbol(currency)} ${new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)}`;
