// Datos del solicitante que viajan con el agendado: nombre y celular.
//
// El destino final de los dos es `calendar_bookings` de OPOLARITY Tasks, a
// través de `sp_external_booking_hold`, que valida el nombre entre 2 y 120
// caracteres y guarda el teléfono con `left(trim(...), 40)`. Los topes de aquí
// son esos, no una preferencia de la UI: pasarse significa que el SP rechaza la
// reserva o que el número llega cortado.

/** Tope de `sp_external_booking_hold` para `invitee_name`. */
export const MAX_REQUESTER_NAME_LENGTH = 120;
/** Mínimo de `sp_external_booking_hold`: con menos, la reserva se rechaza. */
export const MIN_REQUESTER_NAME_LENGTH = 2;
/** `calendar_bookings.invitee_phone` es `text` y se guarda con `left(..., 40)`. */
export const MAX_REQUESTER_PHONE_LENGTH = 40;

/** Lo que se necesita de `accounts` para componer el nombre del solicitante. */
export interface RequesterAccountLike {
  name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  last_name2?: string | null;
}

/**
 * Nombre completo del solicitante a partir de su cuenta.
 *
 * Se compone con los cuatro campos porque el capacitador ve este texto en el
 * evento de Outlook: con solo el nombre de pila, dos personas homónimas son
 * indistinguibles. Si la cuenta no da un nombre utilizable se cae al primer
 * fallback válido (el claim del JWT, el correo, y por último una etiqueta
 * genérica), que es lo que el diálogo hacía antes de esta mejora.
 */
export function buildRequesterName(
  account: RequesterAccountLike | null | undefined,
  fallbacks: Array<string | null | undefined> = [],
): string {
  const composed = [
    account?.name,
    account?.middle_name,
    account?.last_name,
    account?.last_name2,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_REQUESTER_NAME_LENGTH);

  if (composed.length >= MIN_REQUESTER_NAME_LENGTH) return composed;

  for (const fallback of fallbacks) {
    const candidate =
      typeof fallback === "string"
        ? fallback.trim().slice(0, MAX_REQUESTER_NAME_LENGTH)
        : "";
    if (candidate.length >= MIN_REQUESTER_NAME_LENGTH) return candidate;
  }

  return "";
}

/**
 * Celular en un formato que el capacitador pueda marcar sin adivinar el país.
 *
 * `profiles.phone` es **bigint**: llega como número, sin `+` y sin ceros a la
 * izquierda, así que aquí se recibe `string | number` a propósito y se convierte
 * antes de tocar nada. Un móvil peruano de 9 dígitos sale como `+51XXXXXXXXX`;
 * lo que no encaja en ese patrón se deja tal cual (solo dígitos y un `+`
 * inicial), sin inventar el prefijo que falte.
 */
export function normalizePhone(
  raw: string | number | null | undefined,
): string {
  if (raw === null || raw === undefined) return "";

  const text = String(raw).trim();
  if (!text) return "";

  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 9 && digits.startsWith("9")) {
    return `+51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("51")) {
    return `+${digits}`;
  }

  return (hasPlus ? `+${digits}` : digits).slice(0, MAX_REQUESTER_PHONE_LENGTH);
}

/**
 * ¿El celular escrito a mano es publicable?
 *
 * Vacío es válido: el campo es opcional y la mayoría de los usuarios todavía no
 * tiene teléfono cargado en su perfil. Se aceptan 9 dígitos (móvil peruano) o
 * un internacional con `+` y de 8 a 15 dígitos (tope del E.164).
 */
export function isValidPhone(raw: string | number | null | undefined): boolean {
  if (raw === null || raw === undefined) return true;

  const cleaned = String(raw).trim().replace(/[\s\-().]/g, "");
  if (!cleaned) return true;

  return /^[0-9]{9}$/.test(cleaned) || /^\+[0-9]{8,15}$/.test(cleaned);
}
