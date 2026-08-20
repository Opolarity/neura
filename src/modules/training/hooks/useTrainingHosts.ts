import { useCallback, useEffect, useState } from "react";
import { TrainingServiceError, type TrainingHost } from "../types/Training.types";
import { getTrainingHosts } from "../services/Training.service";
import { adaptTrainingHost } from "../adapters/trainings.adapter";

/**
 * Capacitadores disponibles. La lista no es fija —depende de que cada uno
 * tenga su agenda ofrecida y su calendario conectado— así que se pide al
 * abrir el diálogo en vez de cachearla.
 */
export function useTrainingHosts(enabled: boolean) {
  const [hosts, setHosts] = useState<TrainingHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHosts((await getTrainingHosts()).map(adaptTrainingHost));
      setError(null);
    } catch (e) {
      setHosts([]);
      setError(
        e instanceof TrainingServiceError
          ? e.message
          : "No se pudieron cargar los capacitadores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  return { hosts, loading, error, reload: load };
}
