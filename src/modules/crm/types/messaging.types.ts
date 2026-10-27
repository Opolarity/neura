import type { ConversationChannel } from "./crm.types";

/** Estado de una red de mensajería del negocio. */
export type MessagingStatus = "connected" | "not_connected";

export interface MessagingSaleType {
  id: number;
  name: string;
  code: string | null;
}

// ---------------------------------------------------------------------------
// Respuesta de sp_crm_messaging_settings (y de los SP que la cambian)
// ---------------------------------------------------------------------------

export interface MessagingNetworkApi {
  network: ConversationChannel;
  /** El bot responde en esta red (chatbot_settings.bot_networks). */
  bot_enabled: boolean;
  sale_type_id: number | null;
  sale_type_name: string | null;
  configured: boolean;
}

/** Página de Facebook o cuenta de Instagram conectada (sin token: vive en el bot). */
export interface MessagingAccountApi {
  network: "facebook" | "instagram";
  external_id: string;
  name: string | null;
  username: string | null;
  connected_at: string;
}

export interface MessagingSettingsApi {
  success: boolean;
  error?: string;
  bot_enabled: boolean;
  configured: boolean;
  channel_exists: boolean;
  ready: boolean;
  issue: string | null;
  networks: MessagingNetworkApi[];
  accounts?: MessagingAccountApi[];
  /** Solo al conectar: cuentas que ya son de otro negocio y no se tomaron. */
  rejected?: { network: string; external_id: string; name: string | null }[];
}

// ---------------------------------------------------------------------------
// Dominio
// ---------------------------------------------------------------------------

/** Canal de venta de una red: el elegido en Canales de mensajería o el deducido. */
export interface MessagingNetwork {
  network: ConversationChannel;
  saleTypeId: number | null;
  saleTypeName: string | null;
  /** false = no se eligió: se deduce por código o nombre. */
  configured: boolean;
  /** true = el bot responde en esta red; false = solo responden los asesores. */
  botEnabled: boolean;
}

export interface MessagingSettings {
  /** true = el bot responde en alguna red (ver botEnabled de cada red). */
  botEnabled: boolean;
  /** El negocio tiene fila en chatbot_settings. */
  configured: boolean;
  /** Existe el canal del WhatsApp del negocio (CHBOTW). */
  channelExists: boolean;
  /** La configuración alcanza para que el bot funcione. Si no, `issue` dice qué falta. */
  ready: boolean;
  issue: string | null;
  networks: MessagingNetwork[];
  accounts: MessagingAccount[];
}

export interface MessagingAccount {
  network: "facebook" | "instagram";
  externalId: string;
  name: string | null;
  username: string | null;
  connectedAt: string;
}

/** Cómo conectar el número de WhatsApp: seguir en la app WhatsApp Business o número nuevo solo API. */
export type WhatsappConnectMode = "coexistence" | "cloud_api";

export interface WhatsappConnectLink {
  url: string;
  expiresAt: string | null;
  /** false = Meta todavía no aprobó Embedded Signup: la página explica la conexión asistida. */
  embeddedSignup: boolean;
}

export interface WhatsappConnectLinkApi {
  success: boolean;
  error?: string;
  url?: string;
  expires_at?: string | null;
  embedded_signup?: boolean;
}

/** Una red (WhatsApp, Instagram, Facebook, TikTok) tal como la ve la pantalla. */
export interface MessagingChannel extends MessagingNetwork {
  status: MessagingStatus;
}
