import { useQuery } from "@tanstack/react-query";
import { getPriceLists } from "../services/PriceList.service";
import { useEffect, useState } from "react";
import { PriceList, PriceListFilters } from "../types/PriceList.types";
import { getPriceListsAdapter } from "../adapters/PriceList.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export const usePriceList = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PriceListFilters>({
    page: 1,
    size: 20,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: null,
    p_size: null,
    total: null,
  });

  const loadInitial = async () => {
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

  useEffect(() => {
    loadInitial();
  }, []);

  return {
    priceLists,
    loading,
  };
};
