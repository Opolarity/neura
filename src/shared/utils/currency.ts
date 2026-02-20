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
