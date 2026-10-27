import type { ConversationChannel } from "../types/crm.types";

export const CHANNEL_LABEL: Record<ConversationChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

/** Orden de las pestañas de red en la bandeja. */
export const CHANNELS: ConversationChannel[] = ["whatsapp", "instagram", "facebook", "tiktok"];

/**
 * Color de cada red en los gráficos de Rendimiento y Costos: el mismo en la
 * tabla, en el gráfico y en el top de productos. Tokens, no hex.
 */
export const CHANNEL_COLOR: Record<ConversationChannel, string> = {
  whatsapp: "hsl(var(--success))",
  instagram: "hsl(var(--primary))",
  facebook: "hsl(var(--info))",
  tiktok: "hsl(var(--foreground))",
};
