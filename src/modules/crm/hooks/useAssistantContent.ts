import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  createPromptBlockApi,
  deletePromptBlockApi,
  getChatbotTagsApi,
  getChatbotTemplatesApi,
  getPromptBlocksApi,
  savePromptBlockApi,
  setChatbotTemplateSaleSolaApi,
  updateChatbotTemplateApi,
} from "../services/crm.service";
import { toChatbotTemplate } from "../adapters/chatbotTemplates.adapter";
import { toPromptBlock } from "../adapters/chatbotConsiderations.adapter";
import type { ChatbotTemplate, ChatbotTemplateMeta } from "../types/chatbotTemplates.types";
import type { PromptBlock } from "../types/chatbotConsiderations.types";
import type { FunnelStage } from "../types/chatbotAssistant.types";
import { stageSectionKeys } from "../utils/chatbotFunnel";

const LIVE = "El bot lo usa en menos de un minuto.";

/** Título de una indicación nueva: la primera línea, corta (el SP pide una línea sin # { } < > [ ]). */
const tituloDe = (texto: string): string =>
  (texto.split("\n")[0] ?? "")
    .replace(/[{}#<>[\]]/g, "")
    .trim()
    .slice(0, 60) || "Indicación de la tienda";

/**
 * Lo que el Asistente de ventas muestra por etapa además de los ajustes: las
 * plantillas que el bot manda en esa etapa y las indicaciones que agregó la
 * tienda en las secciones del prompt de esa etapa. Solo admin.
 */
export const useAssistantContent = (enabled: boolean) => {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, g, b] = await Promise.all([getChatbotTemplatesApi(), getChatbotTagsApi(), getPromptBlocksApi()]);
      setTemplates((t.data ?? []).map(toChatbotTemplate));
      setTagOptions((g.data ?? []).filter((x) => !x.is_jev).map((x) => x.name));
      setBlocks((b.data ?? []).map(toPromptBlock));
    } catch (error) {
      toastError(error, undefined, "No se pudieron cargar los mensajes del asistente");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
    else setLoading(false);
  }, [enabled, load]);

  /** Mismo guardado que la pantalla de Plantillas: el texto y, si cambió, "responde solo". */
  const saveTemplate = useCallback(
    async (template: ChatbotTemplate, content: string, meta?: ChatbotTemplateMeta, saleSola?: boolean) => {
      setSaving(true);
      try {
        const res = await updateChatbotTemplateApi(template.id, content, template.updatedAt, meta);
        const cambioSola = !template.locked && saleSola != null && saleSola !== template.saleSola;
        if (cambioSola) await setChatbotTemplateSaleSolaApi(template.id, saleSola);
        if (res.changed || cambioSola) {
          toast({ title: "Mensaje guardado", description: LIVE });
          await load();
        }
        return true;
      } catch (error) {
        toastError(error, undefined, "No se pudo guardar el mensaje");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const notesOf = useCallback(
    (stage: FunnelStage) => {
      const keys = new Set(stageSectionKeys(stage));
      return blocks.filter((b) => b.origin === "store" && b.kind === "paragraph" && keys.has(b.headingKey));
    },
    [blocks]
  );

  const run = useCallback(
    async (action: () => Promise<unknown>, done: string, failed: string) => {
      setSaving(true);
      try {
        await action();
        toast({ title: done, description: LIVE });
        await load();
        return true;
      } catch (error) {
        toastError(error, undefined, failed);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  /** Las indicaciones nuevas van en la primera sección de la etapa. */
  const addNote = useCallback(
    (stage: FunnelStage, texto: string) => {
      const headingKey = stageSectionKeys(stage)[0];
      if (!headingKey) return Promise.resolve(false);
      return run(
        () => createPromptBlockApi({ headingKey, title: tituloDe(texto), content: texto.trim(), tags: [] }),
        "Indicación agregada",
        "No se pudo agregar la indicación"
      );
    },
    [run]
  );

  const saveNote = useCallback(
    (block: PromptBlock, texto: string) =>
      run(() => savePromptBlockApi(block.id, texto.trim(), block.updatedAt), "Indicación guardada", "No se pudo guardar la indicación"),
    [run]
  );

  const deleteNote = useCallback(
    (block: PromptBlock) => run(() => deletePromptBlockApi(block.id), "Indicación borrada", "No se pudo borrar la indicación"),
    [run]
  );

  return { templates, tagOptions, loading, saving, saveTemplate, notesOf, addNote, saveNote, deleteNote };
};
