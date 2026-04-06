import { useQuery } from '@tanstack/react-query';
import { getCities } from '@/shared/services/service';

export const useCities = (stateId?: string | null) => {
  return useQuery({
    queryKey: ["cities", stateId],
    queryFn: () => getCities(Number(stateId)),
    enabled: !!stateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
