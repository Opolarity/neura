import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  ActiveFilter,
  ProcessCatalogFilters,
  ProcessCatalogItem,
  SaveProcessCatalogData,
} from "../types/processes.types";

/**
 * Orquestación de un catálogo de procesos.
 *
 * `processes` y `process_group` tienen exactamente la misma forma y la misma
 * pantalla, así que comparten hook y solo se parametrizan las llamadas y los
 * textos. Es el mismo criterio de Atributos, donde un único `useAttributes`
 * gobierna grupos y términos.
 */
interface ProcessCatalogConfig {
  /** Para los toasts: "proceso" / "grupo". */
  entityLabel: string;
  listApi: (filters: ProcessCatalogFilters) => Promise<{
    data: ProcessCatalogItem[];
    pagination: PaginationState;
  }>;
  createApi: (payload: SaveProcessCatalogData) => Promise<void>;
  updateApi: (payload: SaveProcessCatalogData) => Promise<void>;
  deleteApi: (id: number) => Promise<void>;
  /**
   * Solo procesos: la lista de GRUPOS (etapas) a las que puede pertenecer una
   * operación. Si se pasa, el hook carga `groupOptions` para el selector de
   * grupo del formulario. El catálogo de grupos no lo pasa: un grupo no cuelga
   * de otro.
   */
  groupListApi?: (filters: ProcessCatalogFilters) => Promise<{
    data: ProcessCatalogItem[];
    pagination: PaginationState;
  }>;
}

export const useProcessCatalog = ({
  entityLabel,
  listApi,
  createApi,
  updateApi,
  deleteApi,
  groupListApi,
}: ProcessCatalogConfig) => {
  const [items, setItems] = useState<ProcessCatalogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [isActive, setIsActive] = useState<ActiveFilter>(true);

  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [isOpenFormModal, setIsOpenFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcessCatalogItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingItem, setDeletingItem] = useState<ProcessCatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Grupos (etapas) disponibles para el selector del formulario. Solo se
   * llenan cuando el catálogo los necesita (procesos); el de grupos no.
   */
  const [groupOptions, setGroupOptions] = useState<ProcessCatalogItem[]>([]);

  const loadGroups = useCallback(async () => {
    if (!groupListApi) return;
    try {
      const response = await groupListApi({ is_active: true, size: 100 });
      setGroupOptions(response.data);
    } catch {
      // El selector de grupo puede quedarse vacío sin romper el alta: no se
      // avisa para no duplicar el error del listado.
    }
  }, [groupListApi]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listApi({
        search: debouncedSearch,
        is_active: isActive,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setItems(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      toast({ title: `Error al cargar ${entityLabel}s`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [
    listApi,
    entityLabel,
    debouncedSearch,
    isActive,
    pagination.p_page,
    pagination.p_size,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const handleApplyFilters = (applied: ProcessCatalogFilters) => {
    setIsActive(applied.is_active ?? null);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  // El estado por defecto es "solo activos"; cualquier otra cosa cuenta como
  // filtro puesto a mano.
  const hasActiveFilters = isActive !== true;

  const handlePageChange = (page: number) =>
    setPagination((prev) => ({ ...prev, p_page: page }));

  const handlePageSizeChange = (size: number) =>
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));

  const openCreate = () => {
    setEditingItem(null);
    setIsOpenFormModal(true);
  };

  const openEdit = (item: ProcessCatalogItem) => {
    setEditingItem(item);
    setIsOpenFormModal(true);
  };

  const handleSave = async (values: SaveProcessCatalogData) => {
    try {
      setSaving(true);

      if (editingItem) {
        await updateApi({ ...values, id: editingItem.id });
        toast({ title: `${entityLabel} actualizado exitosamente`, variant: "success" });
      } else {
        await createApi(values);
        toast({ title: `${entityLabel} creado exitosamente`, variant: "success" });
      }

      setIsOpenFormModal(false);
      setEditingItem(null);
      fetchItems();
      // Un grupo recién creado tiene que aparecer en el selector.
      loadGroups();
    } catch (error: any) {
      toast({ title: `Error al guardar ${entityLabel}: ` + error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setDeleting(true);
      await deleteApi(deletingItem.id);
      toast({ title: `${entityLabel} desactivado`, variant: "success" });
      setDeletingItem(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: `Error al desactivar ${entityLabel}: ` + error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return {
    items,
    pagination,
    loading,
    search,
    isActive,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    isOpenFilterModal,
    setIsOpenFilterModal,
    isOpenFormModal,
    setIsOpenFormModal,
    editingItem,
    saving,
    openCreate,
    openEdit,
    handleSave,
    deletingItem,
    setDeletingItem,
    deleting,
    handleDelete,
    /** Grupos para el selector del formulario (vacío si el catálogo no los usa). */
    groupOptions,
  };
};
