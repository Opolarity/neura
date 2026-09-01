import { useState, useEffect } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  AttributeGroup,
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
import { toastError } from "@/shared/utils/toastError";

export const useAttributes = () => {
  const [attributes, setAttributes] = useState<AttributeGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
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
      // Collapse all groups when data reloads
      setExpandedGroups(new Set());
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

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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
      toastError(err, "Error al cargar el atributo");
    } finally {
      setLoadingEdit(false);
    }
  };

  const onSaveAttribute = async (data: AttributeFormValues) => {
    setSaving(true);
    try {
      if (data.id) {
        await updateTermGroup(data);
        toast({ title: "Atributo actualizado correctamente", variant: "success" });
      } else {
        await createTermGroup({
          code: data.code,
          name: data.name,
          description: data.description,
        });
        toast({ title: "Atributo creado correctamente", variant: "success" });
      }
      setIsOpenFormModal(false);
      setEditingAttribute(null);
      loadData();
      loadTermGroups();
    } catch (err) {
      console.error(err);
      toastError(err, data.id ? "Error al actualizar el atributo" : "Error al crear el atributo");
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
      toastError(err, "Error al cargar el término");
    } finally {
      setLoadingEdit(false);
    }
  };

  const onSaveTerm = async (data: TermFormValues) => {
    setSavingTerm(true);
    try {
      if (data.id) {
        await updateTerm(data);
        toast({ title: "Término actualizado correctamente", variant: "success" });
      } else {
        await createTerm({
          name: data.name,
          term_group_id: data.term_group_id,
        });
        toast({ title: "Término creado correctamente", variant: "success" });
      }
      setIsOpenTermModal(false);
      setEditingTerm(null);
      loadData();
    } catch (err) {
      console.error(err);
      toastError(err, data.id ? "Error al actualizar el término" : "Error al crear el término");
    } finally {
      setSavingTerm(false);
    }
  };

  const onDeleteAttribute = async (id: number) => {
    setDeleting(true);
    try {
      await deleteTermGroup(id);
      toast({ title: "Atributo y sus términos eliminados correctamente", variant: "success" });
      loadData();
      loadTermGroups();
    } catch (err) {
      console.error(err);
      toastError(err, "Error al eliminar el atributo");
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteTerm = async (id: number) => {
    setDeleting(true);
    try {
      await deleteTerm(id);
      toast({ title: "Término eliminado correctamente", variant: "success" });
      loadData();
    } catch (err) {
      console.error(err);
      toastError(err, "Error al eliminar el término");
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
    expandedGroups,
    toggleGroup,
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
