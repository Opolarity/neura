import type { ChatbotTemplateTopic } from "../types/chatbotTemplates.types";

/**
 * T-917. Las 11 etiquetas de Jev (las que pueden ser principales) con su nombre
 * y una ayuda, en el orden en que se muestran. La clave es la que devuelve
 * Jev: el bot filtra por ella. Los nombres son los mismos que siembra la
 * migración en chatbot_template_tags.
 */
export const TEMPLATE_TOPICS: { value: ChatbotTemplateTopic; label: string; hint: string }[] = [
  { value: "vender", label: "Vender", hint: "Productos, tallas, precios, promos, envío, carrito y datos de entrega." },
  { value: "recibir_pago", label: "Recibir pago", hint: "Comprobantes y pagos de un pedido ya creado." },
  { value: "consultar_pedidos", label: "Consultar pedidos", hint: "Estado, seguimiento, cambios o cancelación de un pedido." },
  { value: "puntos_y_datos", label: "Puntos y datos", hint: "Puntos y nivel Crew, cumpleaños, datos de la cuenta." },
  { value: "falla_web", label: "Falla web", hint: "La web no deja pagar, entrar o registrarse." },
  { value: "conversacion", label: "Conversación", hint: "Saludos, gracias y despedidas. El bot la tiene siempre a mano." },
  { value: "reclamo", label: "Reclamo", hint: "Mala atención en una sede, producto dañado o equivocado." },
  { value: "pedir_asesor", label: "Pedir asesor", hint: "Quiere hablar con una persona. El bot la tiene siempre a mano." },
  { value: "propuesta_comercial", label: "Propuesta comercial", hint: "Auspicios, colaboraciones, agencias, proveedores." },
  { value: "info_tienda", label: "Info tienda", hint: "Sedes, horarios, contacto, redes, políticas, cuidado de prendas y wallpapers." },
  { value: "otro", label: "Otro", hint: "Nada de lo anterior." },
];

export const topicLabel = (topic: string | null): string =>
  TEMPLATE_TOPICS.find((t) => t.value === topic)?.label ?? "Sin tema";

/**
 * Mismo normalizado que fn_chatbot_template_slug: "Cambio de Talla" →
 * cambio_de_talla. Es el nombre con que se guarda la plantilla.
 */
export const templateSlug = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

/**
 * T-917. Si el nombre es una etiqueta de Jev (por nombre, "Otro", o por clave,
 * "info-tienda"), devuelve su nombre; si es una externa, null. Misma regla que
 * fn_chatbot_template_set_tags: una de Jev solo puede ser la principal.
 */
export const jevTagFor = (name: string): string | null => {
  const lower = name.replace(/\s+/g, " ").trim().toLowerCase();
  const slug = templateSlug(name);
  return TEMPLATE_TOPICS.find((t) => t.label.toLowerCase() === lower || t.value === slug)?.label ?? null;
};

/** Mismo mensaje que devuelve el backend. */
export const jevTagError = (label: string): string =>
  `«${label}» es una etiqueta principal: elígela como principal, no como etiqueta extra.`;
