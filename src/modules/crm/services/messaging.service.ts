import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { messagingSettingsAdapter } from "../adapters/messaging.adapter";
import type { ConversationChannel } from "../types/crm.types";
import type {
  MessagingSaleType,
  MessagingSettings,
  MessagingSettingsApi,
  WhatsappConnectLink,
  WhatsappConnectLinkApi,
  WhatsappConnectMode,
} from "../types/messaging.types";

/**
 * Los SP de mensajería son nuevos y todavía no figuran en los tipos generados
 * de Supabase: mismo destipado que crm.service, concentrado acá.
 */
const db = supabase as unknown as {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/** Los SP responden `{ success: false, error }` en vez de lanzar: se pasa a excepción. */
const settingsFrom = (
  data: unknown,
  error: { message: string } | null,
  fallback: string
): MessagingSettings => {
  if (error) throw new Error(error.message);
  const row = data as MessagingSettingsApi | null;
  if (!row) throw new Error(fallback);
  if (!row.success) throw new Error(row.error || fallback);
  return messagingSettingsAdapter(row);
};

/** Canales de venta activos del negocio (el RLS ya filtra por negocio). */
export const getActiveSaleTypesApi = async (): Promise<MessagingSaleType[]> => {
  const { data, error } = await supabase
    .from("sale_types")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessagingSaleType[];
};

/** Modo de atención, estado del WhatsApp y canal de venta de cada red. */
export const getMessagingSettingsApi = async (): Promise<MessagingSettings> => {
  const { data, error } = await db.rpc("sp_crm_messaging_settings");
  return settingsFrom(data, error, "No se pudieron cargar los canales de mensajería.");
};

/** Canal de venta de una red. `null` vuelve a deducirlo por código o nombre. */
export const setNetworkSaleTypeApi = async (
  network: ConversationChannel,
  saleTypeId: number | null
): Promise<MessagingSettings> => {
  const { data, error } = await db.rpc("sp_crm_set_network_sale_type", {
    p_network: network,
    p_sale_type_id: saleTypeId,
  });
  return settingsFrom(data, error, "No se pudo guardar el canal de venta.");
};

/**
 * Conecta las páginas y cuentas de Instagram que el negocio eligió en el login
 * de Facebook. El `code` lo canjea el servicio del bot (tiene el secreto de la
 * app y guarda los tokens); el ERP solo recibe qué cuentas quedaron.
 */
export const connectMetaApi = async (
  code: string
): Promise<{ settings: MessagingSettings; rejected: string[] }> => {
  const data = await invokeFunction<MessagingSettingsApi>("crm-messaging-accounts", {
    body: { action: "connect", code },
  });
  const settings = settingsFrom(data, null, "No se pudo conectar con Meta.");
  const rejected = (data?.rejected ?? []).map((r) => r.name || r.external_id);
  return { settings, rejected };
};

export const disconnectAccountApi = async (
  network: "facebook" | "instagram",
  externalId: string
): Promise<MessagingSettings> => {
  const data = await invokeFunction<MessagingSettingsApi>("crm-messaging-accounts", {
    body: { action: "disconnect", network, externalId },
  });
  return settingsFrom(data, null, "No se pudo desconectar la cuenta.");
};

/** Activa o desactiva el bot en una red. La red sigue en Chats igual. */
export const setNetworkBotEnabledApi = async (
  network: ConversationChannel,
  enabled: boolean
): Promise<MessagingSettings> => {
  const { data, error } = await db.rpc("sp_crm_set_network_bot_enabled", {
    p_network: network,
    p_enabled: enabled,
  });
  return settingsFrom(data, error, "No se pudo cambiar el bot de la red.");
};

/**
 * Enlace de conexión del número de WhatsApp: lo firma el servicio del bot y
 * abre su página de Embedded Signup. El ERP no recibe tokens.
 */
export const getWhatsappConnectLinkApi = async (mode: WhatsappConnectMode): Promise<WhatsappConnectLink> => {
  const data = await invokeFunction<WhatsappConnectLinkApi>("crm-messaging-accounts", {
    body: { action: "whatsapp_connect", mode },
  });
  if (!data?.success || !data.url) throw new Error(data?.error || "No se pudo obtener el enlace de conexión.");
  return { url: data.url, expiresAt: data.expires_at ?? null, embeddedSignup: data.embedded_signup !== false };
};
