import { useEffect, useState } from "react";
import { StockType, StockTypeFilters, StockTypePayload } from "../types/StockType.types";
import { createStockTypeApi, getStockTypesApi, updateStockTypeApi } from "../services/StockType.services";
import { getStockTypesAdapter } from "../adapters/StockType.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "sonner";

export const useStockType = () => {
  const [stockTypes, setStockTypes] = useState<StockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<StockType | null>(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [filters, setFilters] = useState<StockTypeFilters>({
    page: 1,
    size: 20,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: null,
  });

  const handleEditItemChange = (item: StockType | null) => {
    setEditingItem(item);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpenFormModal(isOpen);
  };

  const saveStockType = async (payload: StockTypePayload) => {
    setSaving(true);
    try {
      const isUpdate = payload.id != null;
      isUpdate
        ? await updateStockTypeApi(payload)
        : await createStockTypeApi(payload);

      await load();
      toast.success(
        isUpdate
          ? "Tipo de stock actualizado correctamente"
          : "Tipo de stock creado correctamente"
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el tipo de stock");
    } finally {
      setSaving(false);
      setOpenFormModal(false);
    }
  };

  const load = async (newFilters?: StockTypeFilters): Promise<void> => {
    try {
      const res = await getStockTypesApi(newFilters ?? filters);
      const { data, pagination } = getStockTypesAdapter(res);
      setStockTypes(data);
      setPagination(pagination);
    } catch (error) {
      console.error(error);
    }
  };

  const loadInitial = async (): Promise<void> => {
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    const newFilters: StockTypeFilters = { ...filters, page };
    await load(newFilters);
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = async (size: number) => {
    const newFilters: StockTypeFilters = { ...filters, size, page: 1 };
    await load(newFilters);
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  useEffect(() => {
    loadInitial();
  }, []);

  return {
    stockTypes,
    editingItem,
    openFormModal,
    loading,
    saving,
    pagination,
    handleEditItemChange,
    saveStockType,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  };
};
