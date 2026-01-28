/**
 * Utilidades para formateo de moneda
 */

/**
 * Formatea un número como moneda peruana (S/)
 */
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount.toFixed(2)}`;
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
