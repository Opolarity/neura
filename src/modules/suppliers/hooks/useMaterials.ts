import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Material, MaterialsFilters } from "../types/materials.types";
import { deleteMaterialApi, materialsListApi } from "../services/materials.service";

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<MaterialsFilters>({
    search: "",
    material_class_id: null,
    supplier_id: null,
    page: 1,
    size: 20,
  });

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await materialsListApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setMaterials(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error al cargar materiales", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  /** Aplica los filtros del modal (clase y proveedor). */
  const handleApplyFilters = (applied: MaterialsFilters) => {
    setFilters((prev) => ({
      ...prev,
      material_class_id: applied.material_class_id ?? null,
      supplier_id: applied.supplier_id ?? null,
    }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const hasActiveFilters = Boolean(filters.material_class_id || filters.supplier_id);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  // ---- Eliminar (baja lógica) ---------------------------------------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteMaterialApi(deleteTarget.id);
      toast({ title: "Material eliminado", variant: "success" });
      setDeleteTarget(null);
      await fetchMaterials();
    } catch (error) {
      toastError(error, "No se pudo eliminar el material");
    } finally {
      setDeleting(false);
    }
  };

  return {
    materials,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchMaterials,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
  };
};
