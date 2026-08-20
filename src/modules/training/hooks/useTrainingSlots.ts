import { useCallback, useEffect, useState } from "react";
import {
  TrainingServiceError,
  type TrainingSlotApi,
} from "../types/Training.types";
import { getTrainingSlots } from "../services/Training.service";

/**
 * Horarios de un capacitador. Se recargan cada vez que cambia el slug y con
 * cada `reload()`: la lista se calcula contra su calendario real, así que
 * envejece en minutos.
 */
export function useTrainingSlots(slug: string | null) {
  const [slots, setSlots] = useState<TrainingSlotApi[]>([]);
  const [timezone, setTimezone] = useState<string>("America/Lima");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetSlug: string) => {
    setLoading(true);
    try {
      const response = await getTrainingSlots(targetSlug);
      setSlots(response.slots);
      setTimezone(response.timezone);
      setError(null);
    } catch (e) {
      setSlots([]);
      setError(
        e instanceof TrainingServiceError
          ? e.message
          : "No se pudieron cargar los horarios disponibles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setSlots([]);
      setError(null);
      return;
    }
    void load(slug);
  }, [slug, load]);

  return {
    slots,
    timezone,
    loading,
    error,
    reload: useCallback(() => {
      if (slug) void load(slug);
    }, [slug, load]),
  };
}
