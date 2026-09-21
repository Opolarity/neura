/**
 * El valor del selector de IGV de una línea y su traducción al backend.
 *
 * Radix no admite `""` como valor de un item, por eso «sin declarar» es
 * `TAX_UNSET` y `toIncludesTax` lo traduce al `null` que espera
 * `price_includes_tax`. Aparte del componente para que el fichero de este
 * exporte solo el componente (react-refresh).
 */
export const TAX_UNSET = "unset";

export type TaxIncludedValue = typeof TAX_UNSET | "true" | "false";

/** Del valor del selector al `price_includes_tax` del payload. */
export const toIncludesTax = (value: string): boolean | null =>
  value === "true" ? true : value === "false" ? false : null;
