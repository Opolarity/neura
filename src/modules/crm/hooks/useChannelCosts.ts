import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { getChannelCostsApi } from "../services/crm.service";
import type { ChannelCostsResponse } from "../types/crm.types";
import { RANGE_LABELS, type RangePreset } from "./useChannelMetrics";
import { toastError } from "@/shared/utils/toastError";
import { addCalendarDays, getTodayDate } from "@/shared/utils/date";

const DAYS: Record<RangePreset, number> = {
  "30d": 30,
  "90d": 90,
  "120d": 120,
  "365d": 365,
};

export { RANGE_LABELS };
export type { RangePreset };

export const useChannelCosts = () => {
  const [preset, setPreset] = useState<RangePreset>("90d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChannelCostsResponse | null>(null);

  const { start, end } = useMemo(() => {
    // El rango son dias civiles de LIMA. Antes salian de
    // `new Date().toISOString().slice(0, 10)`, que es el dia UTC: a partir de
    // las 19:00 de Lima el reporte se pedia ya para el dia siguiente.
    const hoy = getTodayDate();
    return { start: addCalendarDays(hoy, -(DAYS[preset] - 1)), end: hoy };
  }, [preset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getChannelCostsApi(start, end));
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "Error al cargar los costos por canal");
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
