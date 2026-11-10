/**
 * CRM > Chatbot > Asistente de ventas: la configuración del bot en una sola
 * página, etapa por etapa de la venta. Reúne los ajustes del prompt
 * (chatbotBehavior.types), las plantillas (chatbotTemplates.types) y las
 * indicaciones de la tienda (chatbotConsiderations.types).
 */

/**
 * Etapas del embudo. En personalizado la base no tiene `funnel_stage`: la
 * etapa de cada ajuste y de cada plantilla la decide la pantalla
 * (utils/chatbotFunnel.ts).
 */
export type FunnelStage =
  | "saludo"
  | "descubrir"
  | "ofrecer"
  | "objeciones"
  | "cierre"
  | "pago"
  | "despues"
  | "asesor"
  | "fuera"
  | "general";
