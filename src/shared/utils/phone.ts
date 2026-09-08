// Celular del usuario, del lado de la pantalla.
//
// En la base se guarda el canónico peruano `51XXXXXXXXX` (ver
// `_shared/phone.ts` de las edge functions, que es quien lo normaliza: el
// backend es la fuente de verdad del formato). Aquí solo se traduce entre ese
// valor y lo que el usuario escribe, que son sus 9 dígitos y nada más.

export const PHONE_LOCAL_LENGTH = 9;

/**
 * Del valor guardado al que se muestra en el input.
 *
 *   51987654321 -> "987654321"
 *   987654321   -> "987654321"   (dato viejo, guardado antes de T-603)
 *   otra cosa   -> tal cual, para no ocultar un dato sucio recortándolo
 */
export function toLocalPhone(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";

  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 11 && digits.startsWith("51")) return digits.slice(2);

  return digits;
}

/** ¿Lo escrito es un celular peruano de 9 dígitos? El vacío se valida aparte. */
export function isValidLocalPhone(raw: string | null | undefined): boolean {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length === PHONE_LOCAL_LENGTH;
}
