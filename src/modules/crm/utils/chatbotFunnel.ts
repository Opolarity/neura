import type { ChatbotTemplateTopic } from "../types/chatbotTemplates.types";
import type { FunnelStage } from "../types/chatbotAssistant.types";

export interface FunnelStageInfo {
  stage: FunnelStage;
  label: string;
  /** Lo que el bot siempre hace en la etapa: lo define Neura, no se edita. */
  rules: string[];
  /**
   * Las secciones del prompt de Overtake de esta etapa (su título tal cual):
   * las indicaciones que agregó la tienda en ellas se muestran acá. La primera
   * es donde se agregan las nuevas.
   */
  sections: string[];
}

/** Las etapas en el orden en que avanza una venta. */
export const FUNNEL_STAGES: FunnelStageInfo[] = [
  {
    // Lo que vale para toda la conversación: cómo se llama la tienda, qué
    // vende, qué palabras no usar. Sus indicaciones van con las preguntas frecuentes.
    stage: "general",
    label: "Tu negocio",
    rules: ["Habla de tu tienda y de tus productos con las palabras que elijas."],
    sections: ["Preguntas frecuentes"],
  },
  {
    stage: "saludo",
    label: "Saludo",
    rules: [
      "Saluda según la hora y se presenta una sola vez por conversación.",
      "Si el cliente viene de un anuncio, muestra primero ese producto.",
    ],
    sections: ["Saludo inicial", "Identidad"],
  },
  {
    stage: "descubrir",
    label: "Descubrir",
    rules: [
      "Muestra lo que hay antes de preguntar; como máximo una pregunta para orientar.",
      "Pregunta talla o medida solo si el producto se elige así.",
    ],
    sections: ["Productos y stock", "Tallas — el corte y el link, nunca una recomendación"],
  },
  {
    stage: "ofrecer",
    label: "Ofrecer",
    rules: [
      "Nunca inventa stock ni precios: los lee de tu catálogo.",
      "Las promociones que menciona son las vigentes en tu ERP.",
    ],
    sections: ["Promociones", "Links de categoría"],
  },
  {
    stage: "objeciones",
    label: "Objeciones",
    rules: [
      "«Está caro»: muestra el valor y las promos reales; nunca baja el precio por su cuenta.",
      "Dudas de talla o medida: guía y tu política de cambios.",
      "Urgencia solo con datos reales: stock bajo o una promo que vence.",
    ],
    sections: ["Descuentos y promociones en el carrito", "Cupones y códigos de descuento"],
  },
  {
    stage: "cierre",
    label: "Cierre",
    rules: ["Una sola decisión por mensaje.", "Pide una confirmación expresa antes de crear el pedido."],
    sections: ["Flujo de venta", "Cierre", "OVTK Crew antes de cerrar la venta"],
  },
  {
    stage: "pago",
    label: "Datos y pago",
    rules: [
      "Pide documento y dirección solo después de que el cliente confirma.",
      "Los métodos de pago, los envíos y sus costos salen de tu ERP.",
    ],
    sections: [
      "Tiendas y sucursales",
      "Plazos de entrega",
      "¿Hacen envíos a provincia?",
      "OVTK Crew al recibir el comprobante",
    ],
  },
  {
    stage: "despues",
    label: "Después de la venta",
    rules: ["Nunca promete un seguimiento ni una fecha que no tiene."],
    sections: [
      "Modificar un pedido ya creado",
      "Cancelar un pedido",
      "Consultas de cliente / pedidos",
      "OVTK Crew — niveles y beneficios",
      "Descuento de cumpleaños",
    ],
  },
  {
    stage: "asesor",
    label: "Pasar a asesor",
    rules: [
      "Ante un reclamo, frustración o algo fuera de tu política, pasa la conversación a una persona.",
      "Fuera del horario de asesores, avisa cuándo le responden.",
    ],
    sections: ["Atención humana (pedido de asesor)", "Recopilar información antes de derivar"],
  },
  {
    stage: "fuera",
    label: "Fuera de tema",
    rules: ["Rechaza amable lo que no es de la tienda y vuelve a la compra.", "Audios y stickers: pide que le escriban."],
    sections: ["Temas fuera de contexto"],
  },
];

/** La etapa de cada ajuste del prompt (por `setting_code`); el resto va a "general". */
const SETTING_STAGE: Record<string, FunnelStage> = {
  treatment: "saludo",
  emoji_level: "saludo",
  reply_length: "saludo",
  vocabulary_products: "descubrir",
  size_equivalences: "descubrir",
  price_reply_shows: "ofrecer",
  closing_question: "cierre",
  customer_prefers_store: "cierre",
  receipt_question: "pago",
  dispatch_time: "pago",
  pickup_outside_lima: "pago",
  store_locations: "pago",
  sales_whatsapp: "asesor",
  marketing_whatsapp: "asesor",
  vocabulary_store: "general",
  business_instructions: "general",
  avoided_words: "general",
};

export const settingStage = (code: string): FunnelStage => SETTING_STAGE[code] ?? "general";

/** La etapa de cada plantilla de Overtake, por nombre. */
const TEMPLATE_NAMES: Record<FunnelStage, string[]> = {
  saludo: [
    "saludo_generico",
    "saludo_manana",
    "saludo_tarde",
    "saludo_noche",
    "saludo_recontacto",
    "saludo_recontacto_con_pedido",
    "imagen_primer_mensaje",
    "identidad_bot",
  ],
  descubrir: ["consulta_talla", "diferencia_cortes", "sin_resultados", "imagen_sin_contexto"],
  ofrecer: [
    "catalogo_general",
    "cierre_listado",
    "venta_por_mayor",
    "promo_envio_vigente",
    "aviso_cambio_promocion",
    "redes_sociales",
    "link_no_permitido",
  ],
  objeciones: ["stock_sucursal", "consulta_cupon", "cupon_aplicado", "cupon_rechazado"],
  cierre: [
    "confirmar_producto",
    "detalle_precio",
    "pregunta_entrega",
    "pedido_no_generado",
    "pedir_telefono",
    "beneficio_primera_compra",
  ],
  pago: [
    "solicitud_datos_envio",
    "pedir_direccion_envio",
    "datos_anteriores_aplicados",
    "datos_anteriores_ofrecer",
    "datos_cuenta_encontrados",
    "recojo_en_tienda",
    "plantilla_pago",
    "comprobante_si",
    "comprobante_en_revision",
    "comprobante_registrado",
    "comprobante_ya_registrado",
    "plantilla_a",
    "plantilla_b",
    "plazos_entrega",
    "envios_provincia",
    "envio_ciudad",
    "envio_ciudad_pregunta",
    "envio_ciudad_pregunta_sucursal",
    "sucursal_en_tu_ciudad",
    "contacto_sucursal",
    "sedes_generales",
    "entrega_hoy_derivacion",
    "entrega_hoy_requisitos",
    "pago_en_cuotas",
  ],
  despues: [
    "tracking_pedido",
    "cancelar_pedido",
    "consulta_pedido_sin_dato",
    "cambiar_direccion_de_pedido",
    "como_sumar_puntos",
  ],
  asesor: [
    "asesor_humano",
    "asesor_humano_con_resumen",
    "derivacion_pedido_no_generado",
    "derivacion_marketing",
    "datos_para_marketing",
    "plantilla_web",
    "soporte_cuenta",
    "disculpa_reclamo",
    "fotos_reclamo",
    "queja_sucursal",
    "queja_sucursal_sigue",
    "offtopic_queja_pedido",
    "horario_de_atencion",
  ],
  fuera: [
    "despedida",
    "audio_no_soportado",
    "tipo_no_soportado",
    "mensaje_no_llego",
    "offtopic_tarea",
    "offtopic_random",
    "offtopic_estilo",
    "offtopic_cumpleanos",
    "wallpapers",
  ],
  general: ["cuidado_de_prendas", "marca_peruana"],
};

const TEMPLATE_STAGE = new Map<string, FunnelStage>(
  (Object.entries(TEMPLATE_NAMES) as [FunnelStage, string[]][]).flatMap(([stage, names]) =>
    names.map((name) => [name, stage] as const)
  )
);

/** Programa OVTK Crew: todas sus plantillas van a "después de la venta". */
const TEMPLATE_PREFIXES: ReadonlyArray<readonly [prefix: string, stage: FunnelStage]> = [
  ["crew_", "despues"],
  ["cumple_", "despues"],
];

/** Si la plantilla no está en la lista, su tema (Jev) decide la etapa. */
const TOPIC_STAGE: Record<ChatbotTemplateTopic, FunnelStage> = {
  vender: "ofrecer",
  recibir_pago: "pago",
  info_tienda: "pago",
  consultar_pedidos: "despues",
  puntos_y_datos: "despues",
  reclamo: "asesor",
  pedir_asesor: "asesor",
  propuesta_comercial: "asesor",
  falla_web: "asesor",
  conversacion: "fuera",
  otro: "fuera",
};

export const templateStage = (name: string, topic: ChatbotTemplateTopic | null): FunnelStage =>
  TEMPLATE_STAGE.get(name) ??
  TEMPLATE_PREFIXES.find(([prefix]) => name.startsWith(prefix))?.[1] ??
  (topic ? TOPIC_STAGE[topic] : undefined) ??
  "general";

/** La clave de una sección en chatbot_prompt_blocks: `h:` + título en minúsculas, sin tildes. */
export const sectionKey = (title: string): string =>
  "h:" +
  title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Las claves de sección de una etapa; la primera es donde se agregan las indicaciones nuevas. */
export const stageSectionKeys = (stage: FunnelStage): string[] =>
  (FUNNEL_STAGES.find((s) => s.stage === stage)?.sections ?? []).map(sectionKey);
