import { useQuery } from '@tanstack/react-query';
import { getCountries } from '@/shared/services/service';

export const useCountries = () => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
