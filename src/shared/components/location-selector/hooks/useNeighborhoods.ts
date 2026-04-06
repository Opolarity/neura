import { useQuery } from "@tanstack/react-query";
import { getNeighborhoods } from "@/shared/services/service";

export const useNeighborhoods = (cityId?: string | null) => {
  return useQuery({
    queryKey: ["neighborhoods", cityId],
    queryFn: () => getNeighborhoods(Number(cityId)),
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
