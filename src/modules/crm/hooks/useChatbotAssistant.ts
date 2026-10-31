import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  discardChatbotPromptSettingsApi,
  getChatbotPromptSettingsApi,
  publishChatbotPromptSettingsApi,
  saveChatbotPromptSettingDraftApi,
} from "../services/crm.service";
import { currentValue, sameValue, toChatbotPromptSetting } from "../adapters/chatbotBehavior.adapter";
import { isDirtySetting } from "../adapters/chatbotAssistant.adapter";
import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";

/**
 * Asistente de ventas: los ajustes del prompt (chatbot_prompt_settings). Lo
 * que se cambia queda como borrador hasta publicar; el bot lee solo lo
 * publicado. Solo admin (lo exigen también los SP).
 */
export const useChatbotAssistant = (enabled: boolean) => {
  const [settings, setSettings] = useState<ChatbotPromptSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const refresh = useCallback(async () => {
    const res = await getChatbotPromptSettingsApi();
    setSettings((res.data ?? []).map(toChatbotPromptSetting));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } catch (error) {
      toastError(error, undefined, "No se pudo cargar el asistente de ventas");
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (enabled) void load();
    else setLoading(false);
  }, [enabled, load]);

  /** Guarda el borrador de un ajuste. Devuelve true si se guardó (o no había cambios). */
  const saveDraft = useCallback(
    async (setting: ChatbotPromptSetting, value: string) => {
      if (sameValue(setting, value, currentValue(setting))) return true;
      setSavingCode(setting.code);
      try {
        await saveChatbotPromptSettingDraftApi(setting.code, value, setting.draftUpdatedAt);
        await refresh();
        return true;
      } catch (error) {
        toastError(error, undefined, `No se pudo guardar «${setting.name}»`);
        return false;
      } finally {
        setSavingCode(null);
      }
    },
    [refresh]
  );

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await publishChatbotPromptSettingsApi();
      const n = res.published ?? 0;
      await refresh();
      toast({
        title: n === 1 ? "1 cambio publicado" : `${n} cambios publicados`,
        description: "El bot lo usa en menos de un minuto.",
      });
    } catch (error) {
      toastError(error, undefined, "No se pudieron publicar los cambios");
    } finally {
      setPublishing(false);
    }
  }, [refresh]);

  const discard = useCallback(async () => {
    setPublishing(true);
    try {
      await discardChatbotPromptSettingsApi();
      await refresh();
      toast({ title: "Cambios descartados" });
    } catch (error) {
      toastError(error, undefined, "No se pudieron descartar los cambios");
    } finally {
      setPublishing(false);
    }
  }, [refresh]);

  const pendingChanges = useMemo(() => settings.filter(isDirtySetting).length, [settings]);

  return { settings, loading, savingCode, publishing, pendingChanges, saveDraft, publish, discard };
};
