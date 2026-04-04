import { useQuery } from "@tanstack/react-query";
import { getActivePriceLists, getPriceLists } from "../services/PriceList.service";

export const usePriceList = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["price-list"],
    queryFn: getPriceLists,
  });

  return {
    priceLists: data ?? [],
    loading: isLoading,
    error,
    refetch,
  };
};

export const useActivePriceLists = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["price-list", "active"],
    queryFn: getActivePriceLists,
  });

  return {
    priceLists: data ?? [],
    loading: isLoading,
    error,
  };
};
