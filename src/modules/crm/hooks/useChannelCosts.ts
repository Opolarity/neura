import { useCallback, useEffect, useMemo, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { getChannelCostsApi } from "../services/crm.service";
import type { ChannelCostsResponse } from "../types/crm.types";
import { rangeFor, type RangePreset } from "./useChannelMetrics";

export const useChannelCosts = () => {
  const [preset, setPreset] = useState<RangePreset>("90d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChannelCostsResponse | null>(null);

  const { start, end } = useMemo(() => rangeFor(preset), [preset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getChannelCostsApi(start, end));
    } catch (error) {
      toastError(error, "No se pudieron cargar los costos por canal");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Con cero movimientos cargados, la contribución sería igual a lo cobrado y
  // se leería como 100 % de ganancia: la pantalla necesita saberlo para no
  // mostrar ese número.
  const sinCostos =
    !!data && data.channels.every((c) => c.cost_entries === 0) && data.shared.length === 0;

  return { preset, setPreset, loading, data, sinCostos, reload: fetchData };
};
