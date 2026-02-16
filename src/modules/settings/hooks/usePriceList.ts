import { useQuery } from "@tanstack/react-query";
import {
  createPriceListApi,
  deletePriceListApi,
  getPriceLists,
  updatePriceListApi,
} from "../services/PriceList.service";
import { useEffect, useState } from "react";
import {
  PriceList,
  PriceListFilters,
  PriceListPayload,
} from "../types/PriceList.types";
import { getPriceListsAdapter } from "../adapters/PriceList.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "sonner";

export const usePriceList = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceList | null>(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [filters, setFilters] = useState<PriceListFilters>({
    page: 1,
    size: 20,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: null,
  });

  const handleEditItemChange = (item: PriceList | null) => {
    setEditingItem(item);
  };

  const savePriceList = async (newPriceList: PriceListPayload) => {
    setSaving(true);
    try {
      const isUpdate = newPriceList?.id != null;

      isUpdate
        ? await updatePriceListApi(newPriceList)
        : await createPriceListApi(newPriceList);

      await load();
      toast.success(
        isUpdate
          ? "Precio de Lista actualizado correctamente"
          : "Precio de Lista creado correctamente",
      );
    } catch (error) {
      console.error(error);
      toast.error("Precio de Lista no creado");
    } finally {
      setSaving(false);
      setOpenFormModal(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpenFormModal(isOpen);
  };

  const deletePriceList = async (id: number) => {
    try {
      await deletePriceListApi(id);
      if (priceLists.length === 1) {
        const newPage = filters.page > 1 ? filters.page - 1 : 1;
        await load({ ...filters, page: newPage });
        setPagination((prev) => ({ ...prev, p_page: newPage }));
        setFilters((prev) => ({ ...prev, page: newPage }));
      } else {
        await load();
      }
      toast.success("Precio de Lista eliminado correctamente");
    } catch (error) {
      console.error(error);
    }
  };
  const load = async (newFilters?: PriceListFilters): Promise<void> => {
    try {
      const priceListsRes = newFilters
        ? await getPriceLists(newFilters)
        : await getPriceLists(filters);
      const { data, pagination } = getPriceListsAdapter(priceListsRes);
      setPriceLists(data);
      setPagination(pagination);
    } catch (error) {
      console.error(error);
    }
  };

  const loadInitial = async (): Promise<void> => {
    setLoading(true);
    try {
      const priceListsRes = await getPriceLists(filters);
      const { data, pagination } = getPriceListsAdapter(priceListsRes);
      setPriceLists(data);
      setPagination(pagination);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const handlePageChange = async (page: number) => {
    const newFilters: PriceListFilters = { ...filters, page };
    await load(newFilters);

    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const newFilters = { ...prev, page };
      return newFilters;
    });
  };

  const handlePageSizeChange = async (size: number) => {
    const newFilters: PriceListFilters = { ...filters, size, page: 1 };
    await load(newFilters);
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const newFilters = { ...prev, size, page: 1 };
      return newFilters;
    });
  };

  useEffect(() => {
    loadInitial();
  }, []);

  return {
    priceLists,
    editingItem,
    openFormModal,
    loading,
    saving,
    pagination,
    handleEditItemChange,
    savePriceList,
    deletePriceList,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  };
};
