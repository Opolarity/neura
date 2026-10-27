import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { loginWithFacebookForBusiness } from "@/shared/services/facebookLogin";
import { toastError } from "@/shared/utils/toastError";
import {
  connectMetaApi,
  disconnectAccountApi,
  getMessagingSettingsApi,
  getWhatsappConnectLinkApi,
  setNetworkBotEnabledApi,
  setNetworkSaleTypeApi,
} from "../services/messaging.service";
import type { ConversationChannel } from "../types/crm.types";
import type { MessagingAccount, MessagingSettings, WhatsappConnectMode } from "../types/messaging.types";
import { CHANNEL_LABEL } from "../utils/channels";

/**
 * Configuración de mensajería del negocio: en qué redes responde el bot, cuentas
 * de Facebook e Instagram conectadas y canal de venta de cada red. La usan Canales de mensajería (para cambiarla) y Chats (para
 * saber si hay bot y qué canal de venta lleva el pedido de cada red).
 */
export const useMessagingSettings = () => {
  const [settings, setSettings] = useState<MessagingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await getMessagingSettingsApi());
    } catch (error) {
      toastError(error, "No se pudieron cargar los canales de mensajería");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Cada cambio devuelve la configuración entera: se reemplaza tal cual. */
  const save = useCallback(async (action: () => Promise<MessagingSettings>, done: string, failed: string) => {
    setSaving(true);
    try {
      setSettings(await action());
      toast({ title: done });
      return true;
    } catch (error) {
      toastError(error, failed);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const setSaleType = useCallback(
    (network: ConversationChannel, saleTypeId: number | null) =>
      save(() => setNetworkSaleTypeApi(network, saleTypeId), "Canal de venta guardado", "No se pudo guardar el canal de venta"),
    [save]
  );

  const setNetworkBotEnabled = useCallback(
    (network: ConversationChannel, enabled: boolean) =>
      save(
        () => setNetworkBotEnabledApi(network, enabled),
        enabled ? `Bot activado en ${CHANNEL_LABEL[network]}` : `Bot desactivado en ${CHANNEL_LABEL[network]}`,
        "No se pudo cambiar el bot"
      ),
    [save]
  );

  /**
   * Conecta el número de WhatsApp con Meta: abre en otra ventana la página de
   * Embedded Signup del bot. La ventana se abre antes de pedir el enlace para
   * que el navegador no la bloquee; al cerrarla se recarga el estado.
   */
  const connectWhatsapp = useCallback(
    async (mode: WhatsappConnectMode) => {
      const popup = window.open("", "neura-whatsapp-connect", "width=640,height=760");
      setSaving(true);
      try {
        const link = await getWhatsappConnectLinkApi(mode);
        if (popup) popup.location.href = link.url;
        else window.open(link.url, "_blank", "noopener");
        if (!link.embeddedSignup) {
          toast({
            title: "Conexión asistida",
            description: "Meta todavía no habilitó la conexión automática: la página te explica cómo seguir.",
          });
        }
        if (popup) {
          const timer = window.setInterval(() => {
            if (!popup.closed) return;
            window.clearInterval(timer);
            void load();
          }, 1000);
        }
        return true;
      } catch (error) {
        popup?.close();
        toastError(error, "No se pudo conectar WhatsApp");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  /** Abre el login de Facebook y conecta lo que el negocio elija ahí. */
  const connectMeta = useCallback(async () => {
    setSaving(true);
    try {
      const code = await loginWithFacebookForBusiness();
      if (!code) return false; // cerró el diálogo sin terminar
      const { settings: next, rejected } = await connectMetaApi(code);
      setSettings(next);
      toast({
        title: "Cuentas conectadas",
        description: rejected.length
          ? `No se conectaron porque ya pertenecen a otro negocio: ${rejected.join(", ")}.`
          : undefined,
      });
      return true;
    } catch (error) {
      toastError(error, "No se pudo conectar con Meta");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const disconnectAccount = useCallback(
    (account: MessagingAccount) =>
      save(
        () => disconnectAccountApi(account.network, account.externalId),
        "Cuenta desconectada",
        "No se pudo desconectar la cuenta"
      ),
    [save]
  );

  /** Redes que reciben mensajes hoy: WhatsApp si existe su canal y las de las cuentas conectadas. */
  const connectedNetworks = useMemo<ConversationChannel[]>(() => {
    const networks = new Set<ConversationChannel>();
    if (settings?.channelExists) networks.add("whatsapp");
    for (const a of settings?.accounts ?? []) networks.add(a.network);
    return [...networks];
  }, [settings]);

  /** El bot responde en esa red. Mientras carga se asume que sí: así no parpadean sus controles. */
  const botEnabledFor = useCallback(
    (network: ConversationChannel) =>
      settings ? settings.networks.find((n) => n.network === network)?.botEnabled ?? false : true,
    [settings]
  );

  /** Canal de venta de los pedidos que salen de un chat de esa red; null si no hay. */
  const saleTypeFor = useCallback(
    (network: ConversationChannel) =>
      settings?.networks.find((n) => n.network === network)?.saleTypeId ?? null,
    [settings]
  );

  return {
    settings,
    loading,
    saving,
    reload: load,
    setSaleType,
    setNetworkBotEnabled,
    botEnabledFor,
    saleTypeFor,
    connectMeta,
    connectWhatsapp,
    disconnectAccount,
    connectedNetworks,
  };
};
