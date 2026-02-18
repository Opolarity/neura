import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AttributeRow,
  AttributeFilters,
  AttributePaginationState,
  AttributeFormValues,
  TermFormValues,
  TermGroupOption,
} from "../types/Attributes.types";
import {
  getAttributesApi,
  createTermGroup,
  getTermGroupById,
  updateTermGroup,
  deleteTermGroup,
  getTermGroupsForSelect,
  createTerm,
  getTermById,
  updateTerm,
  deleteTerm,
} from "../services/Attributes.service";
import { attributesAdapter } from "../adapters/Attributes.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const useAttributes = () => {
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<AttributePaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<AttributeFilters>({
    search: null,
    minProducts: null,
    maxProducts: null,
    group: null,
    order: null,
    page: 1,
    size: 20,
  });

  const [isOpenFormModal, setIsOpenFormModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeFormValues | null>(null);

  const [isOpenTermModal, setIsOpenTermModal] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermFormValues | null>(null);
  const [termGroups, setTermGroups] = useState<TermGroupOption[]>([]);

  const [deleting, setDeleting] = useState(false);

  const loadData = async (currentFilters?: AttributeFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = currentFilters || filters;
      const response = await getAttributesApi({
        page: filtersToUse.page,
        size: filtersToUse.size,
        search: filtersToUse.search,
        min_pr: filtersToUse.minProducts,
        max_pr: filtersToUse.maxProducts,
        group: filtersToUse.group,
        order: filtersToUse.order,
      });

      const { attributes: adaptedAttributes, pagination: adaptedPagination } =
        attributesAdapter(response);

      setAttributes(adaptedAttributes);
      setPagination(adaptedPagination);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al cargar los atributos");
    } finally {
      setLoading(false);
    }
  };

  const loadTermGroups = async () => {
    try {
      const groups = await getTermGroupsForSelect();
      setTermGroups(groups);
    } catch (err) {
      console.error("Error loading term groups:", err);
    }
  };

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch || null, page: 1 };
      setFilters(newFilters);
      loadData(newFilters);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadData();
    loadTermGroups();
  }, []);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onOrderChange = (order: string) => {
    const newFilters = { ...filters, order: order === "none" ? null : order };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onOpenFilterModal = () => setIsOpenFilterModal(true);
  const onCloseFilterModal = () => setIsOpenFilterModal(false);

  const onApplyFilter = (newFilters: Partial<AttributeFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadData(updatedFilters);
    setIsOpenFilterModal(false);
  };

  const onResetFilters = () => {
    const resetFilters: AttributeFilters = {
      search: null,
      minProducts: null,
      maxProducts: null,
      group: null,
      order: null,
      page: 1,
      size: filters.size,
    };
    setSearch("");
    setFilters(resetFilters);
    loadData(resetFilters);
    setIsOpenFilterModal(false);
  };

  const onOpenNewAttribute = () => {
    setEditingAttribute(null);
    setIsOpenFormModal(true);
  };

  const onCloseFormModal = () => {
    setIsOpenFormModal(false);
    setEditingAttribute(null);
  };

  const onEditAttribute = async (id: number) => {
    setLoadingEdit(true);
    try {
      const attributeData = await getTermGroupById(id);
      setEditingAttribute(attributeData);
      setIsOpenFormModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar el atributo");
    } finally {
      setLoadingEdit(false);
    }
  };

  const onSaveAttribute = async (data: AttributeFormValues) => {
    setSaving(true);
    try {
      if (data.id) {
        await updateTermGroup(data);
        toast.success("Atributo actualizado correctamente");
      } else {
        await createTermGroup({
          code: data.code,
          name: data.name,
          description: data.description,
        });
        toast.success("Atributo creado correctamente");
      }
      setIsOpenFormModal(false);
      setEditingAttribute(null);
      loadData();
      loadTermGroups();
    } catch (err) {
      console.error(err);
      toast.error(data.id ? "Error al actualizar el atributo" : "Error al crear el atributo");
    } finally {
      setSaving(false);
    }
  };

  const onOpenNewTerm = () => {
    setEditingTerm(null);
    setIsOpenTermModal(true);
  };

  const onCloseTermModal = () => {
    setIsOpenTermModal(false);
    setEditingTerm(null);
  };

  const onEditTerm = async (id: number) => {
    setLoadingEdit(true);
    try {
      const termData = await getTermById(id);
      setEditingTerm(termData);
      setIsOpenTermModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar el término");
    } finally {
      setLoadingEdit(false);
    }
  };

  const onSaveTerm = async (data: TermFormValues) => {
    setSavingTerm(true);
    try {
      if (data.id) {
        await updateTerm(data);
        toast.success("Término actualizado correctamente");
      } else {
        await createTerm({
          name: data.name,
          term_group_id: data.term_group_id,
        });
        toast.success("Término creado correctamente");
      }
      setIsOpenTermModal(false);
      setEditingTerm(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(data.id ? "Error al actualizar el término" : "Error al crear el término");
    } finally {
      setSavingTerm(false);
    }
  };

  const onDeleteAttribute = async (id: number) => {
    setDeleting(true);
    try {
      await deleteTermGroup(id);
      toast.success("Atributo y sus términos eliminados correctamente");
      loadData();
      loadTermGroups();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el atributo");
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteTerm = async (id: number) => {
    setDeleting(true);
    try {
      await deleteTerm(id);
      toast.success("Término eliminado correctamente");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el término");
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters =
    filters.minProducts !== null ||
    filters.maxProducts !== null ||
    filters.group !== null;

  return {
    attributes,
    loading,
    error,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onResetFilters,
    isOpenFormModal,
    saving,
    loadingEdit,
    editingAttribute,
    onOpenNewAttribute,
    onCloseFormModal,
    onEditAttribute,
    onSaveAttribute,
    isOpenTermModal,
    savingTerm,
    editingTerm,
    termGroups,
    onOpenNewTerm,
    onCloseTermModal,
    onEditTerm,
    onSaveTerm,
    deleting,
    onDeleteAttribute,
    onDeleteTerm,
  };
};