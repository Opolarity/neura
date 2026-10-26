import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  discardChatbotPromptSettingsApi,
  getChatbotPromptSettingsApi,
  publishChatbotPromptSettingsApi,
  saveChatbotPromptSettingDraftApi,
} from "../services/crm.service";
import { currentValue, toChatbotPromptSetting } from "../adapters/chatbotBehavior.adapter";
import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";

/**
 * Comportamiento del chatbot. El formulario edita una copia local; "Guardar
 * borrador" la manda al ERP sin que el bot la vea, y "Publicar" guarda lo que
 * falte y publica todos los borradores juntos.
 */
export const useChatbotBehavior = (enabled: boolean) => {
  const [settings, setSettings] = useState<ChatbotPromptSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChatbotPromptSettingsApi();
      const rows = (res.data ?? []).map(toChatbotPromptSetting);
      setSettings(rows);
      setValues(Object.fromEntries(rows.map((s) => [s.code, currentValue(s)])));
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "Error al cargar el comportamiento del chatbot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    else setLoading(false);
  }, [enabled, load]);

  const setValue = useCallback((code: string, value: string) => {
    setValues((prev) => ({ ...prev, [code]: value }));
  }, []);

  /** Cambios del formulario que todavía no se guardaron como borrador. */
  const unsaved = useMemo(
    () => settings.filter((s) => (values[s.code] ?? "") !== currentValue(s)),
    [settings, values]
  );

  /** Borradores guardados en el ERP que el bot todavía no ve. */
  const pendingDrafts = useMemo(() => settings.filter((s) => s.draft !== null), [settings]);

  const saveUnsaved = async (): Promise<void> => {
    for (const s of unsaved) {
      await saveChatbotPromptSettingDraftApi(s.code, values[s.code] ?? "", s.draftUpdatedAt);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    setSaving(true);
    try {
      await saveUnsaved();
      toast({ title: "Borrador guardado", description: "El bot sigue usando lo publicado hasta que publiques." });
      await load();
      return true;
    } catch (error) {
      toastError(error, undefined, "No se pudo guardar el borrador");
      await load();
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async (): Promise<boolean> => {
    setSaving(true);
    try {
      await saveUnsaved();
      const res = await publishChatbotPromptSettingsApi();
      toast({
        title: "Cambios publicados",
        description: res.published
          ? "El bot los empieza a usar en menos de un minuto."
          : "No había cambios para publicar.",
      });
      await load();
      return true;
    } catch (error) {
      toastError(error, undefined, "No se pudo publicar");
      await load();
      return false;
    } finally {
      setSaving(false);
    }
  };

  const discard = async (): Promise<boolean> => {
    setSaving(true);
    try {
      if (pendingDrafts.length) await discardChatbotPromptSettingsApi();
      toast({ title: "Cambios descartados", description: "Volviste a lo que el bot usa hoy." });
      await load();
      return true;
    } catch (error) {
      toastError(error, undefined, "No se pudieron descartar los cambios");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    settings,
    values,
    setValue,
    unsaved,
    pendingDrafts,
    saveDraft,
    publish,
    discard,
  };
};
