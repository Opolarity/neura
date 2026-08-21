import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { getChannelCostsApi } from "../services/crm.service";
import type { ChannelCostsResponse } from "../types/crm.types";
import { RANGE_LABELS, type RangePreset } from "./useChannelMetrics";

const DAYS: Record<RangePreset, number> = {
  "30d": 30,
  "90d": 90,
  "120d": 120,
  "365d": 365,
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export { RANGE_LABELS };
export type { RangePreset };

export const useChannelCosts = () => {
  const [preset, setPreset] = useState<RangePreset>("90d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChannelCostsResponse | null>(null);

  const { start, end } = useMemo(() => {
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - (DAYS[preset] - 1));
    return { start: iso(desde), end: iso(hoy) };
  }, [preset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getChannelCostsApi(start, end));
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al cargar los costos por canal",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Con cero movimientos cargados, la contribución sería idéntica a lo cobrado
  // y se leería como 100 % de ganancia. La pantalla necesita saberlo para no
  // mostrar ese número.
  const sinCostos =
    !!data &&
    data.channels.every((c) => c.cost_entries === 0) &&
    data.shared.length === 0;

  return { preset, setPreset, loading, data, sinCostos, reload: fetchData };
};
