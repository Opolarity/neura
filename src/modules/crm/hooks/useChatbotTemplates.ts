import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  createChatbotTemplateApi,
  getChatbotTagsApi,
  getChatbotTemplatesApi,
  updateChatbotTemplateApi,
} from "../services/crm.service";
import { toChatbotTemplate, toFriendlyText } from "../adapters/chatbotTemplates.adapter";
import type {
  ChatbotTagApi,
  ChatbotTemplate,
  ChatbotTemplateCreateInput,
  ChatbotTemplateMeta,
} from "../types/chatbotTemplates.types";

/**
 * Filtro por etiqueta (T-917): el id de una etiqueta, "none" (sin etiqueta
 * principal) o "" (todas). Una plantilla entra si la etiqueta es su principal
 * o una de sus extra.
 */
export type TagFilter = string;

/**
 * Las ~80 plantillas llegan de una sola vez; la búsqueda, el filtro por
 * etiqueta (T-917) y la paginación son locales.
 */
export const useChatbotTemplates = (enabled: boolean) => {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [tags, setTags] = useState<ChatbotTagApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<TagFilter>("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, tagsRes] = await Promise.all([getChatbotTemplatesApi(), getChatbotTagsApi()]);
      setTemplates((res.data ?? []).map(toChatbotTemplate));
      setTags(tagsRes.data ?? []);
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
    const tag = tags.find((g) => String(g.id) === tagFilter);
    return templates.filter((t) => {
      if (tagFilter === "none" && t.topic != null) return false;
      if (tag && !(tag.is_jev && t.topic === tag.code) && !t.tags.some((n) => n.toLowerCase() === tag.name.toLowerCase())) {
        return false;
      }
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || toFriendlyText(t.content).toLowerCase().includes(q);
    });
  }, [templates, tags, search, tagFilter]);

  /** Plantillas sin etiqueta principal (filas viejas): solo para ofrecer el filtro si hay. */
  const withoutTopic = useMemo(() => templates.filter((t) => t.topic == null).length, [templates]);

  const rows = useMemo(() => filtered.slice((page - 1) * size, page * size), [filtered, page, size]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onTagFilterChange = (value: TagFilter) => {
    setTagFilter(value);
    setPage(1);
  };

  const onPageSizeChange = (value: number) => {
    setSize(value);
    setPage(1);
  };

  /**
   * Devuelve true si se guardó (o no había cambios), para cerrar el editor.
   * `meta` (etiquetas) no va en las especiales.
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
        description: "El bot empieza a usarla en menos de un minuto.",
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
    tags,
    tagFilter,
    onTagFilterChange,
    withoutTopic,
    pagination: { p_page: page, p_size: size, total: filtered.length },
    onPageChange: setPage,
    onPageSizeChange,
    save,
    create,
  };
};
