import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  createPromptBlockApi,
  deletePromptBlockApi,
  getChatbotPromptSettingsApi,
  getPromptBlocksApi,
  publishChatbotPromptSettingsApi,
  restorePromptBlockApi,
  saveChatbotPromptSettingDraftApi,
  savePromptBlockApi,
  setPromptBlockActiveApi,
} from "../services/crm.service";
import { toChatbotPromptSetting } from "../adapters/chatbotBehavior.adapter";
import { toPromptBlock } from "../adapters/chatbotConsiderations.adapter";
import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { PromptBlock, PromptBlockCreateInput } from "../types/chatbotConsiderations.types";

const LIVE = "El bot lo usa en menos de un minuto.";

/**
 * Consideraciones del chatbot: los párrafos del prompt y los ajustes que
 * aparecen dentro de ellos. Todo lo que se guarda queda vivo (no hay paso de
 * publicar): por eso cada acción recarga la lista.
 */
export const useChatbotConsiderations = (enabled: boolean) => {
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [settings, setSettings] = useState<ChatbotPromptSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [b, s] = await Promise.all([getPromptBlocksApi(), getChatbotPromptSettingsApi()]);
      setBlocks((b.data ?? []).map(toPromptBlock));
      setSettings((s.data ?? []).map(toChatbotPromptSetting));
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "Error al cargar las consideraciones del chatbot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    else setLoading(false);
  }, [enabled, load]);

  /** Corre una acción, avisa y recarga. Devuelve true si salió bien. */
  const run = async (action: () => Promise<unknown>, ok: string, fail: string): Promise<boolean> => {
    setSaving(true);
    try {
      await action();
      toast({ title: ok, description: LIVE });
      await load(true);
      return true;
    } catch (error) {
      toastError(error, undefined, fail);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBlock = (b: PromptBlock, content: string, meta?: { title?: string; tags?: string[] }) =>
    run(() => savePromptBlockApi(b.id, content, b.updatedAt, meta), "Guardado", "No se pudo guardar");

  const createBlock = (input: PromptBlockCreateInput) =>
    run(() => createPromptBlockApi(input), "Agregado", "No se pudo agregar");

  const setActive = (b: PromptBlock, active: boolean) =>
    run(() => setPromptBlockActiveApi(b.id, active), active ? "Prendido" : "Apagado", "No se pudo cambiar");

  const restore = (b: PromptBlock) =>
    run(() => restorePromptBlockApi(b.id), "Volvió al texto del equipo", "No se pudo volver al texto del equipo");

  const remove = (b: PromptBlock) => run(() => deletePromptBlockApi(b.id), "Borrado", "No se pudo borrar");

  /** Un ajuste que aparece dentro de un párrafo: se guarda y se publica de una vez. */
  const saveSetting = (s: ChatbotPromptSetting, value: string) =>
    run(
      async () => {
        await saveChatbotPromptSettingDraftApi(s.code, value, s.draftUpdatedAt);
        await publishChatbotPromptSettingsApi();
      },
      "Ajuste guardado",
      "No se pudo guardar el ajuste"
    );

  return { loading, saving, blocks, settings, reload: load, saveBlock, createBlock, setActive, restore, remove, saveSetting };
};
