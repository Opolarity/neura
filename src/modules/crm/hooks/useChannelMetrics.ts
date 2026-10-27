import { useCallback, useEffect, useMemo, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { addCalendarDays, getTodayDate } from "@/shared/utils/date";
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

export type RangePreset = "30d" | "90d" | "120d" | "365d";

export const RANGE_DAYS: Record<RangePreset, number> = {
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

/** Rango en días civiles de Lima, terminando hoy. */
export const rangeFor = (preset: RangePreset) => {
  const hoy = getTodayDate();
  return { start: addCalendarDays(hoy, -(RANGE_DAYS[preset] - 1)), end: hoy };
};

/**
 * Con 30 días un gráfico diario ya tiene 30 barras; con un año serían 365 e
 * ilegible. La granularidad la decide el rango, no el usuario.
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

  const { start, end } = useMemo(() => rangeFor(preset), [preset]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Las tres consultas son independientes: en serie tardaría el triple.
      const [metrics, overTime, top] = await Promise.all([
        getChannelMetricsApi(start, end),
        getChannelOverTimeApi(start, end, granularityFor(preset)),
        getChannelTopProductsApi(start, end, null, 5),
      ]);

      setChannels(metrics.channels);
      setCompany(metrics.company);
      setPoints(overTime.points);
      setProducts(top.products);
    } catch (error) {
      toastError(error, "No se pudo cargar el rendimiento por canal");
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
    granularity: granularityFor(preset),
    reload: fetchAll,
  };
};
