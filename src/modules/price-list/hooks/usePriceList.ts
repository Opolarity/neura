import { useQuery } from "@tanstack/react-query";
import { getPriceLists } from "../services/PriceList.service";

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
