import { useQuery } from '@tanstack/react-query';
import { getStates } from '@/shared/services/service';

export const useStates = (countryId?: string | null) => {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: () => getStates(Number(countryId)),
    enabled: !!countryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
