import type { ChatbotTemplateStatus, ChatbotTemplateTopic } from "../types/chatbotTemplates.types";

/**
 * T-917. Los temas de Jev con su nombre para el ERP, en el orden en que se
 * muestran. La clave es la que devuelve Jev: el bot filtra por ella.
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
  { value: "info_tienda", label: "Info tienda", hint: "Sedes, horarios, contacto, redes y políticas." },
  { value: "otro", label: "Otro", hint: "Nada de lo anterior." },
];

export const topicLabel = (topic: string | null): string =>
  TEMPLATE_TOPICS.find((t) => t.value === topic)?.label ?? "Sin tema";

export const TEMPLATE_STATUSES: { value: ChatbotTemplateStatus; label: string }[] = [
  { value: "consulting_information", label: "Sigue la conversación (consulta de información)" },
  { value: "other", label: "Cierra el tema o deriva a una persona" },
];
