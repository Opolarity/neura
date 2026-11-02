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

/**
 * Cómo se muestra una plantilla en la etapa:
 * - automatica: la arma el bot en un flujo fijo (locked); va plegada.
 * - responde_sola: Jev puede mandarla sin pasar por el modelo (sale_sola).
 * - base: el bot la usa como referencia para redactar.
 */
export type AssistantTemplateKind = "automatica" | "responde_sola" | "base";
