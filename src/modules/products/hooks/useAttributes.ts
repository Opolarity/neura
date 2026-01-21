import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AttributeRow,
  AttributeFilters,
  AttributePaginationState,
  AttributeFormValues,
} from "../types/Attributes.types";
import { getAttributesApi, createTermGroup } from "../services/Attributes.service";
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

  // Form modal state
  const [isOpenFormModal, setIsOpenFormModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeFormValues | null>(null);

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

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };

  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

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

  // Form modal handlers
  const onOpenNewAttribute = () => {
    setEditingAttribute(null);
    setIsOpenFormModal(true);
  };

  const onCloseFormModal = () => {
    setIsOpenFormModal(false);
    setEditingAttribute(null);
  };

  const onSaveAttribute = async (data: AttributeFormValues) => {
    setSaving(true);
    try {
      await createTermGroup({
        code: data.code,
        name: data.name,
        description: data.description,
      });
      toast.success("Atributo creado correctamente");
      setIsOpenFormModal(false);
      setEditingAttribute(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el atributo");
    } finally {
      setSaving(false);
    }
  };

  return {
    attributes,
    loading,
    error,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onResetFilters,
    // Form modal
    isOpenFormModal,
    saving,
    editingAttribute,
    onOpenNewAttribute,
    onCloseFormModal,
    onSaveAttribute,
  };
};
