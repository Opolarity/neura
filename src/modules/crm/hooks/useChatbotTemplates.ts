import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { createChatbotTemplateApi, getChatbotTemplatesApi, updateChatbotTemplateApi } from "../services/crm.service";
import { toChatbotTemplate, toFriendlyText } from "../adapters/chatbotTemplates.adapter";
import type {
  ChatbotTemplate,
  ChatbotTemplateCreateInput,
  ChatbotTemplateMeta,
  ChatbotTemplateTopic,
} from "../types/chatbotTemplates.types";

/** Filtro de tema: uno de Jev, las que no tienen ("none") o todas (""). */
export type TopicFilter = ChatbotTemplateTopic | "none" | "";

/**
 * Las ~80 plantillas llegan de una sola vez; la búsqueda, el filtro por tema
 * (T-917) y la paginación son locales.
 */
export const useChatbotTemplates = (enabled: boolean) => {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<TopicFilter>("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChatbotTemplatesApi();
      setTemplates((res.data ?? []).map(toChatbotTemplate));
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "Error al cargar las plantillas del chatbot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    else setLoading(false);
  }, [enabled, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (topic === "none" ? t.topic != null : topic && t.topic !== topic) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || toFriendlyText(t.content).toLowerCase().includes(q);
    });
  }, [templates, search, topic]);

  /** Cuántas hay por tema, para el filtro. */
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of templates) counts[t.topic ?? "none"] = (counts[t.topic ?? "none"] ?? 0) + 1;
    return counts;
  }, [templates]);

  const rows = useMemo(() => filtered.slice((page - 1) * size, page * size), [filtered, page, size]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onTopicChange = (value: TopicFilter) => {
    setTopic(value);
    setPage(1);
  };

  const onPageSizeChange = (value: number) => {
    setSize(value);
    setPage(1);
  };

  /**
   * Devuelve true si se guardó (o no había cambios), para cerrar el editor.
   * `meta` solo va en las creadas desde el ERP.
   */
  const save = async (template: ChatbotTemplate, content: string, meta?: ChatbotTemplateMeta): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await updateChatbotTemplateApi(template.id, content, template.updatedAt, meta);
      if (res.changed) {
        toast({
          title: "Plantilla guardada",
          description: "El bot empieza a usar el texto nuevo en menos de un minuto.",
        });
        await load();
      }
      return true;
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "No se pudo guardar la plantilla");
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** T-917. Devuelve true si se creó, para cerrar el editor. */
  const create = async (input: ChatbotTemplateCreateInput): Promise<boolean> => {
    setSaving(true);
    try {
      await createChatbotTemplateApi(input);
      toast({
        title: "Plantilla creada",
        description: "El bot empieza a usarla en menos de un minuto, cuando el cliente pida lo que dice «Cuándo usarla».",
      });
      await load();
      return true;
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "No se pudo crear la plantilla");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    rows,
    search,
    onSearchChange,
    topic,
    onTopicChange,
    topicCounts,
    pagination: { p_page: page, p_size: size, total: filtered.length },
    onPageChange: setPage,
    onPageSizeChange,
    save,
    create,
  };
};
