import { useQuery } from "@tanstack/react-query";
import {
  createPriceListApi,
  deletePriceListApi,
  getPriceLists,
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

  const savePriceList = async (newPriceList: PriceListPayload) => {
    setSaving(true);
    try {
      await createPriceListApi(newPriceList);
      await load();
      toast.success("Precio de Lista creado correctamente");
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
      await load();
      toast.success("Precio de Lista eliminado correctamente");
    } catch (error) {
      console.error(error);
    }
  };
  //REPENSAR LÓGICA DE FILTROS FALLARÁ

  const loadFilters = async (filter: number): Promise<void> => {
    try {
      const priceListsRes = await getPriceLists({ ...filters, page: filter });
      const { data, pagination } = getPriceListsAdapter(priceListsRes);
      setPriceLists(data);
      setPagination(pagination);
    } catch (error) {
      console.error(error);
    }
  };

  const load = async (): Promise<void> => {
    try {
      const priceListsRes = await getPriceLists(filters);
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
  const onPageChange = async (page: number) => {
    await loadFilters(page);

    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const newFilters = { ...prev, page };
      return newFilters;
    });
  };

  const handlePageSizeChange = async (size: number) => {
    await loadFilters(size);
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
    openFormModal,
    loading,
    saving,
    pagination,
    savePriceList,
    deletePriceList,
    handleOpenChange,
  };
};
