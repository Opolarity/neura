import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  printTemplateCreateApi,
  printTemplateGetApi,
  printTemplateSetDefaultApi,
  printTemplateUpdateApi,
  printTemplatesAllApi,
} from "../services/printTemplates.service";
import { SYSTEM_PRINT_TEMPLATES } from "../constants/systemPrintTemplates";
import {
  printTemplateEditPath,
  printTemplateViewPath,
} from "../constants/printTemplateRoutes";
import type { PrintTemplateCreateValues } from "../components/PrintTemplateFormDialog";
import {
  PRINT_TEMPLATE_AREAS,
  type PrintTemplateArea,
  type PrintTemplateItem,
  type SystemPrintTemplate,
} from "../types/printTemplates.types";

/** Un documento del ERP con sus plantillas personalizadas. */
export interface PrintDocumentRow {
  system: SystemPrintTemplate;
  templates: PrintTemplateItem[];
  /** La personalizada con que se imprime; null: la del sistema. */
  inUse: PrintTemplateItem | null;
}

/** Los documentos de un área, en el orden de las plantillas del sistema. */
export interface PrintDocumentGroup {
  area: PrintTemplateArea;
  documents: PrintDocumentRow[];
}

/**
 * El listado de plantillas, por documento: cada documento del ERP (una
 * plantilla del sistema) con sus personalizadas, de las que una sola, o la
 * del sistema, es la que se usa al imprimir. Se agrupan por área.
 *
 * Las personalizadas son pocas: se cargan todas (las activas) y se agrupan
 * aquí; el buscador y el área filtran sin volver a consultar.
 */
export const usePrintTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PrintTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  // Por defecto, todas las áreas.
  const [area, setArea] = useState<PrintTemplateArea | null>(null);
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);

  // Los documentos desplegados, por code.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  // El documento cuya plantilla en uso se está cambiando.
  const [changingCode, setChangingCode] = useState<string | null>(null);

  const [isOpenFormModal, setIsOpenFormModal] = useState(false);
  const [createCode, setCreateCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<PrintTemplateItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setTemplates(await printTemplatesAllApi());
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al cargar plantillas",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const term = debouncedSearch.trim().toLowerCase();

  const groups = useMemo<PrintDocumentGroup[]>(() => {
    const byCode = new Map<string, PrintTemplateItem[]>();
    templates.forEach((item) =>
      byCode.set(item.systemCode, [
        ...(byCode.get(item.systemCode) ?? []),
        item,
      ]),
    );
    const rows = SYSTEM_PRINT_TEMPLATES.filter(
      (system) => area === null || system.area === area,
    )
      .map((system) => {
        const own = byCode.get(system.code) ?? [];
        return {
          system,
          templates: own,
          inUse: own.find((item) => item.isDefault) ?? null,
        };
      })
      // Por el nombre del documento o el de alguna de sus plantillas.
      .filter(
        (row) =>
          !term ||
          row.system.section.toLowerCase().includes(term) ||
          row.templates.some((item) => item.title.toLowerCase().includes(term)),
      );
    return PRINT_TEMPLATE_AREAS.map((name) => ({
      area: name,
      documents: rows.filter((row) => row.system.area === name),
    })).filter((group) => group.documents.length > 0);
  }, [templates, area, term]);

  // Buscando una plantilla por su nombre, su documento se ve desplegado.
  const isExpanded = (row: PrintDocumentRow) =>
    expanded.has(row.system.code) ||
    (Boolean(term) &&
      row.templates.some((item) => item.title.toLowerCase().includes(term)));

  const toggleExpanded = (code: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  /** Imprimir el documento con una personalizada o (null) con la del sistema. */
  const handleUse = async (row: PrintDocumentRow, id: number | null) => {
    const code = row.system.code;
    if ((row.inUse?.id ?? null) === id) return;
    try {
      setChangingCode(code);
      await printTemplateSetDefaultApi(code, id);
      setTemplates((previous) =>
        previous.map((item) =>
          item.systemCode === code
            ? { ...item, isDefault: item.id === id }
            : item,
        ),
      );
    } catch (error) {
      toast({
        title: "No se pudo cambiar la plantilla en uso",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setChangingCode(null);
    }
  };

  /** Elimina una personalizada; si era la que se usaba, vuelve la del sistema. */
  const confirmRemove = async () => {
    if (!removing?.id) return;
    const id = removing.id;
    try {
      setBusyId(id);
      await printTemplateUpdateApi(id, { isActive: false });
      setTemplates((previous) => previous.filter((item) => item.id !== id));
      setRemoving(null);
    } catch (error) {
      toast({
        title: "No se pudo eliminar la plantilla",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  /** Una copia de una personalizada, con su diseño; no queda en uso. */
  const handleDuplicate = async (item: PrintTemplateItem) => {
    if (item.id === null) return;
    try {
      setBusyId(item.id);
      const detail = await printTemplateGetApi(item.id);
      await printTemplateCreateApi({
        title: `${detail.title} (copia)`,
        systemCode: detail.systemCode,
        contentJson: detail.contentJson,
      });
      await fetchTemplates();
    } catch (error) {
      toast({
        title: "No se pudo duplicar la plantilla",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  /** «Nueva plantilla»: de un documento, ya elegido; arriba, sin elegir. */
  const openCreate = (code: string | null = null) => {
    setCreateCode(code);
    setIsOpenFormModal(true);
  };

  const handleCreate = async (values: PrintTemplateCreateValues) => {
    try {
      setSaving(true);
      // Con su diseño de arranque: la medida y la impresión elegidas quedan
      // guardadas desde ya, aunque no se toque nada en el editor.
      const id = await printTemplateCreateApi({
        title: values.title,
        systemCode: values.systemCode,
        contentJson: values.contentJson,
      });
      if (values.use) {
        try {
          await printTemplateSetDefaultApi(values.systemCode, id);
        } catch (error) {
          // Ya está creada: se avisa y se sigue al editor.
          toast({
            title: "La plantilla se creó, pero no se pudo poner en uso",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        }
      }
      setIsOpenFormModal(false);
      navigate(printTemplateEditPath(id));
    } catch (error) {
      toast({
        title: "No se pudo crear la plantilla",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: PrintTemplateItem) => {
    if (item.id !== null) navigate(printTemplateEditPath(item.id));
  };

  const openView = (system: SystemPrintTemplate) =>
    navigate(printTemplateViewPath(system.code));

  return {
    groups,
    loading,
    search,
    setSearch,
    area,
    setArea,
    hasActiveFilters: area !== null,
    isOpenFilterModal,
    setIsOpenFilterModal,
    isExpanded,
    toggleExpanded,
    changingCode,
    handleUse,
    removing,
    setRemoving,
    confirmRemove,
    busyId,
    handleDuplicate,
    isOpenFormModal,
    setIsOpenFormModal,
    createCode,
    openCreate,
    saving,
    handleCreate,
    openEdit,
    openView,
  };
};
