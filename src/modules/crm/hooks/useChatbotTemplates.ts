import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { getChatbotTemplatesApi, updateChatbotTemplateApi } from "../services/crm.service";
import { toChatbotTemplate, toFriendlyText } from "../adapters/chatbotTemplates.adapter";
import type { ChatbotTemplate } from "../types/chatbotTemplates.types";

/**
 * Las ~80 plantillas llegan de una sola vez; la búsqueda y la paginación son
 * locales.
 */
export const useChatbotTemplates = (enabled: boolean) => {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
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
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || toFriendlyText(t.content).toLowerCase().includes(q)
    );
  }, [templates, search]);

  const rows = useMemo(() => filtered.slice((page - 1) * size, page * size), [filtered, page, size]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onPageSizeChange = (value: number) => {
    setSize(value);
    setPage(1);
  };

  /** Devuelve true si se guardó (o no había cambios), para cerrar el editor. */
  const save = async (template: ChatbotTemplate, content: string): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await updateChatbotTemplateApi(template.id, content, template.updatedAt);
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

  return {
    loading,
    saving,
    rows,
    search,
    onSearchChange,
    pagination: { p_page: page, p_size: size, total: filtered.length },
    onPageChange: setPage,
    onPageSizeChange,
    save,
  };
};
