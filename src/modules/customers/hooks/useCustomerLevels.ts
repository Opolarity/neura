import { useCallback, useEffect, useState } from "react";
import { getCustomerLevels } from "../services/customerLevels.service";
import type { CustomerLevel } from "../types/customerLevels.types";

export const useCustomerLevels = () => {
  const [levels, setLevels] = useState<CustomerLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchLevels = useCallback(() => {
    setIsLoading(true);
    setError(false);
    getCustomerLevels()
      .then(setLevels)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  return { levels, isLoading, error, reload: fetchLevels };
};
