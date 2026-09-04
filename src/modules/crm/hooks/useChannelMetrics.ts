import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  getChannelMetricsApi,
  getChannelOverTimeApi,
  getChannelTopProductsApi,
} from "../services/crm.service";
import type {
  ChannelMetricsApi,
  ChannelPointApi,
  ChannelProductApi,
} from "../types/crm.types";
import { toastError } from "@/shared/utils/toastError";
import { addCalendarDays, getTodayDate } from "@/shared/utils/date";

export type RangePreset = "30d" | "90d" | "120d" | "365d";

const DAYS: Record<RangePreset, number> = {
  "30d": 30,
  "90d": 90,
  "120d": 120,
  "365d": 365,
};

export const RANGE_LABELS: Record<RangePreset, string> = {
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "120d": "Últimos 120 días",
  "365d": "Último año",
};

/**
 * Con 30 días un gráfico diario ya tiene 30 puntos por canal; con un año
 * tendría 365 y sería ilegible. La granularidad la decide el rango, no el
 * usuario: es una decisión que no aporta nada tomar a mano.
 */
const granularityFor = (preset: RangePreset): "day" | "week" | "month" =>
  preset === "30d" ? "day" : preset === "365d" ? "month" : "week";

export const useChannelMetrics = () => {
  const [preset, setPreset] = useState<RangePreset>("90d");
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelMetricsApi[]>([]);
  const [company, setCompany] = useState({ sold: 0, collected: 0 });
  const [points, setPoints] = useState<ChannelPointApi[]>([]);
  const [products, setProducts] = useState<ChannelProductApi[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const { start, end } = useMemo(() => {
    // El rango son dias civiles de LIMA. Antes salian de
    // `new Date().toISOString().slice(0, 10)`, que es el dia UTC: a partir de
    // las 19:00 de Lima el reporte se pedia ya para el dia siguiente.
    const hoy = getTodayDate();
    return { start: addCalendarDays(hoy, -(DAYS[preset] - 1)), end: hoy };
  }, [preset]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Las tres consultas son independientes: en serie la pantalla tardaría
      // el triple sin ninguna razón.
      const [metrics, overTime, top] = await Promise.all([
        getChannelMetricsApi(start, end),
        getChannelOverTimeApi(start, end, granularityFor(preset)),
        getChannelTopProductsApi(start, end, null, 5),
      ]);

      setChannels(metrics.channels);
      setCompany(metrics.company);
      setRange({ start: metrics.range.start, end: metrics.range.end });
      setPoints(overTime.points);
      setProducts(top.products);
    } catch (error) {
      console.error(error);
      toastError(error, undefined, "Error al cargar el rendimiento por canal");
    } finally {
      setLoading(false);
    }
  }, [start, end, preset]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    preset,
    setPreset,
    loading,
    channels,
    company,
    points,
    products,
    range,
    granularity: granularityFor(preset),
    reload: fetchAll,
  };
};
