import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MovementClass, MovementClassFilters, MovementClassPayload } from "../types/MovementClasses.types";
import {
  createMovementClassApi,
  getMovementClassesApi,
  updateMovementClassApi,
} from "../services/MovementClasses.services";
import { getMovementClassesAdapter } from "../adapters/MovementClasses.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export const useMovementClasses = () => {
  const [classes, setClasses] = useState<MovementClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<MovementClass | null>(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [filters, setFilters] = useState<MovementClassFilters>({ page: 1, size: 20 });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: null,
  });

  const load = async (newFilters?: MovementClassFilters) => {
    try {
      const res = await getMovementClassesApi(newFilters ?? filters);
      const { data, pagination: pag } = getMovementClassesAdapter(res);
      setClasses(data);
      setPagination(pag);
    } catch (error) {
      console.error(error);
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  };

  const saveMovementClass = async (payload: MovementClassPayload) => {
    setSaving(true);
    try {
      const isUpdate = payload.id != null;
      isUpdate
        ? await updateMovementClassApi(payload)
        : await createMovementClassApi(payload);

      await load();
      toast.success(
        isUpdate
          ? "Clase actualizada correctamente"
          : "Clase creada correctamente"
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la clase");
    } finally {
      setSaving(false);
      setOpenFormModal(false);
    }
  };

  const handlePageChange = async (page: number) => {
    const newFilters = { ...filters, page };
    await load(newFilters);
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = async (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    await load(newFilters);
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  useEffect(() => {
    loadInitial();
  }, []);

  return {
    classes,
    loading,
    saving,
    editingItem,
    openFormModal,
    pagination,
    handleEditItemChange: setEditingItem,
    handleOpenChange: setOpenFormModal,
    saveMovementClass,
    handlePageChange,
    handlePageSizeChange,
  };
};
