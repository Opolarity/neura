import { useQuery } from "@tanstack/react-query";
import {
  getAllCities,
  getAllNeighborhoods,
  getAllStates,
  getCountries,
} from "../services/Shipping.service";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useShippingLocations = () => {
  const countries = useQuery({
    queryKey: ["shipping-locations", "countries"],
    queryFn: getCountries,
    staleTime: FIVE_MINUTES,
  });
  const states = useQuery({
    queryKey: ["shipping-locations", "states"],
    queryFn: getAllStates,
    staleTime: FIVE_MINUTES,
  });
  const cities = useQuery({
    queryKey: ["shipping-locations", "cities"],
    queryFn: getAllCities,
    staleTime: FIVE_MINUTES,
  });
  const neighborhoods = useQuery({
    queryKey: ["shipping-locations", "neighborhoods"],
    queryFn: getAllNeighborhoods,
    staleTime: FIVE_MINUTES,
  });

  return {
    countries: countries.data ?? [],
    states: states.data ?? [],
    cities: cities.data ?? [],
    neighborhoods: neighborhoods.data ?? [],
    isLoading:
      countries.isLoading ||
      states.isLoading ||
      cities.isLoading ||
      neighborhoods.isLoading,
  };
};
