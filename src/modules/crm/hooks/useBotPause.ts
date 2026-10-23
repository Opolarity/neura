import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { botPauseAdapter, NO_PAUSE } from "../adapters/botPause.adapter";
import { getBotPauseApi, pauseBotApi, resumeBotApi } from "../services/crm.service";
import type { BotPauseState, Conversation } from "../types/crm.types";

/**
 * T-983: si el bot está en pausa en la conversación abierta, y las acciones
 * para pausarlo (con plazo o sin límite) y reactivarlo. El estado vive en el
 * servicio del chatbot: se lee al abrir la conversación y tras cada acción.
 */
export const useBotPause = (channelId: number | null, conversation: Conversation | null) => {
  const [state, setState] = useState<BotPauseState>(NO_PAUSE);
  const [busy, setBusy] = useState(false);

  const phoneNumber = conversation?.phoneNumber ?? null;
  const whatsappUserId = conversation?.whatsappUserId ?? null;

  const load = useCallback(async () => {
    if (!channelId || (!phoneNumber && !whatsappUserId)) {
      setState(NO_PAUSE);
      return;
    }
    try {
      setState(botPauseAdapter(await getBotPauseApi(channelId, phoneNumber, whatsappUserId)));
    } catch {
      // Sin estado no se inventa uno: se muestra como sin pausa. El error real
      // aparece si el asesor intenta pausar o reactivar.
      setState(NO_PAUSE);
    }
  }, [channelId, phoneNumber, whatsappUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (action: () => Promise<unknown>, title: string) => {
      if (!channelId) return false;
      setBusy(true);
      try {
        const api = await action();
        setState(botPauseAdapter(api as Parameters<typeof botPauseAdapter>[0]));
        toast({ title });
        return true;
      } catch (error) {
        toastError(error, "No se pudo cambiar el estado del bot");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [channelId]
  );

  /** `until` = ISO con zona, o null para "hasta que lo reactive". */
  const pause = useCallback(
    (until: string | null) =>
      run(
        () => pauseBotApi(channelId!, phoneNumber, whatsappUserId, until),
        until ? "Bot pausado en esta conversación" : "Bot pausado hasta que lo reactives"
      ),
    [run, channelId, phoneNumber, whatsappUserId]
  );

  const resume = useCallback(
    () => run(() => resumeBotApi(channelId!, phoneNumber, whatsappUserId), "Bot reactivado en esta conversación"),
    [run, channelId, phoneNumber, whatsappUserId]
  );

  return { state, busy, pause, resume, reload: load };
};
