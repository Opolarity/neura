/**
 * Enlace que abre WhatsApp (web o app) con el mensaje ya escrito; quien lo
 * abre solo pulsa Enviar. Sin número, WhatsApp pide elegir el contacto.
 *
 * @param phone ya normalizado (ver `toWhatsAppPhone`).
 */
export function buildWhatsAppUrl(phone: string | null, text: string): string {
  const phoneParam = phone ? `phone=${phone}&` : "";
  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`;
}
