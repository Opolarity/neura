import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportCard, ReportSelect, ChartLoading, EmptyReportState } from '../shared/ReportScaffold';
import { formatCurrency } from '@/shared/utils/currency';
import { salesService } from '../../services/reports.service';
import type { HeatmapMetric, ReportsFilters, SalesGeoHeatmapItem } from '../../types/reports.types';

import deptTopo from '@/assets/geo/peru-departments.json';
import provTopo from '@/assets/geo/peru-provinces.json';

const METRIC_OPTIONS: Array<{ value: HeatmapMetric; label: string }> = [
  { value: 'total_revenue', label: 'Ingresos' },
  { value: 'order_count',   label: 'Pedidos'  },
];

// Recorre todas las coordenadas de un array GeoJSON anidado
function walkCoords(coords: unknown, cb: (lon: number, lat: number) => void): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number') { cb(coords[0] as number, coords[1] as number); return; }
  (coords as unknown[]).forEach((c) => walkCoords(c, cb));
}

// Calcula center + scale para hacer zoom al bounding box de las features dadas
function fitProjection(
  features: Array<{ geometry?: { coordinates?: unknown } }>,
): { center: [number, number]; scale: number } {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  features.forEach((f) => {
    walkCoords(f.geometry?.coordinates, (lon, lat) => {
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    });
  });
  if (!isFinite(minLon)) return { center: [-75.0, -9.5], scale: 1700 };
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const extentLon = maxLon - minLon;
  const extentLat = maxLat - minLat;
  const maxExtent = Math.max(extentLon, extentLat, 0.1);
  // Perú cubre ~18° lat a scale 1700 en 480px → escalar proporcionalmente con padding del 65%
  const scale = Math.round((1700 * 18) / maxExtent * 0.65);
  return { center: [centerLon, centerLat], scale };
}

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'hsl(221,30%,93%)';
  const t = Math.min(value / max, 1);
  const lightness = Math.round(92 - t * 50);
  return `hsl(221,83%,${lightness}%)`;
}

interface SelectedDept {
  geoMap: string;
  label: string;
  id: number;
}

interface SalesHeatmapProps {
  filters: ReportsFilters;
}

export function SalesHeatmap({ filters }: SalesHeatmapProps) {
  const [metric, setMetric]             = useState<HeatmapMetric>('total_revenue');
  const [selectedDept, setSelectedDept] = useState<SelectedDept | null>(null);
  const [hovered, setHovered]           = useState<SalesGeoHeatmapItem | null>(null);

  const nationalQuery = useQuery({
    queryKey: ['rpt_geo_heatmap_national', filters],
    queryFn:  () => salesService.getGeoHeatmap(filters),
    staleTime: 1000 * 60 * 5,
  });

  const drillQuery = useQuery({
    queryKey: ['rpt_geo_heatmap_drill', filters, selectedDept?.id],
    queryFn:  () => salesService.getGeoHeatmap(filters, selectedDept!.id),
    enabled:  !!selectedDept,
    staleTime: 1000 * 60 * 5,
  });

  const activeData  = selectedDept ? (drillQuery.data ?? [])   : (nationalQuery.data ?? []);
  const isLoading   = selectedDept ? drillQuery.isLoading       : nationalQuery.isLoading;

  const dataMap = useMemo(() => {
    const map = new Map<string, SalesGeoHeatmapItem>();
    for (const item of activeData) {
      if (item.geo_map) map.set(item.geo_map, item);
    }
    return map;
  }, [activeData]);

  const maxValue = useMemo(() => {
    if (activeData.length === 0) return 0;
    return Math.max(...activeData.map((d) => d[metric] as number));
  }, [activeData, metric]);

  // Proyección calculada dinámicamente al hacer drill-down
  const drillProjection = useMemo(() => {
    if (!selectedDept) return null;
    const features = ((provTopo as unknown as { features: Array<{ properties: Record<string, string>; geometry?: { coordinates?: unknown } }> }).features ?? [])
      .filter((f) => f.properties['FIRST_NOMB'] === selectedDept.geoMap);
    return fitProjection(features);
  }, [selectedDept]);

  const projectionConfig = drillProjection ?? { center: [-75.0, -9.5] as [number, number], scale: 1700 };

  // useCallback para evitar re-renders innecesarios en Geography
  const handleDeptClick = useCallback((geoProps: Record<string, string>) => {
    const geoMap = geoProps['NOMBDEP'];
    const item   = dataMap.get(geoMap);
    if (!item?.state_id) return;
    setSelectedDept({ geoMap, label: item.label, id: item.state_id });
    setHovered(null);
  }, [dataMap]);

  const title = selectedDept
    ? `Mapa de calor — ${selectedDept.label}`
    : 'Mapa de calor — Ventas por departamento';

  return (
    <ReportCard
      title={
        <div className="flex items-center gap-2">
          {selectedDept && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => { setSelectedDept(null); setHovered(null); }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver
            </Button>
          )}
          <span>{title}</span>
        </div>
      }
      actions={
        <ReportSelect
          value={metric}
          onValueChange={setMetric}
          options={METRIC_OPTIONS}
          className="w-32"
        />
      }
    >
      {isLoading ? (
        <ChartLoading className="h-[480px]" />
      ) : activeData.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo seleccionado</EmptyReportState>
      ) : (
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={projectionConfig}
            style={{ width: '100%', height: '480px' }}
          >
            {selectedDept ? (
              <Geographies geography={provTopo}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties['FIRST_NOMB'] === selectedDept.geoMap)
                    .map((geo) => {
                      const geoMap = geo.properties['NOMBPROV'] as string;
                      const item   = dataMap.get(geoMap);
                      const value  = item ? (item[metric] as number) : 0;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getColor(value, maxValue)}
                          stroke="white"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover:   { outline: 'none', opacity: 0.85, cursor: 'default' },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={() => setHovered(item ?? { geo_map: geoMap, label: geoMap, order_count: 0, total_revenue: 0 })}
                          onMouseLeave={() => setHovered(null)}
                        />
                      );
                    })
                }
              </Geographies>
            ) : (
              <Geographies geography={deptTopo}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const geoMap = geo.properties['NOMBDEP'] as string;
                    const item   = dataMap.get(geoMap);
                    const value  = item ? (item[metric] as number) : 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getColor(value, maxValue)}
                        stroke="white"
                        strokeWidth={0.8}
                        style={{
                          default: { outline: 'none' },
                          hover:   { outline: 'none', opacity: 0.8, cursor: item?.state_id ? 'pointer' : 'default' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={() => setHovered(item ?? { geo_map: geoMap, label: geoMap, order_count: 0, total_revenue: 0 })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleDeptClick(geo.properties as Record<string, string>)}
                      />
                    );
                  })
                }
              </Geographies>
            )}
          </ComposableMap>

          {/* Tooltip */}
          {hovered && (
            <div className="mx-auto mt-2 w-fit rounded-md border bg-popover px-4 py-2 text-sm shadow-sm">
              <p className="font-semibold">{hovered.label}</p>
              <p className="text-muted-foreground">
                Ingresos: <span className="font-medium text-foreground">{formatCurrency(hovered.total_revenue)}</span>
              </p>
              <p className="text-muted-foreground">
                Pedidos: <span className="font-medium text-foreground">{hovered.order_count}</span>
              </p>
            </div>
          )}

          {/* Leyenda de escala */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Menor</span>
            <div className="flex h-3 w-32 overflow-hidden rounded">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  style={{ flex: 1, background: getColor(i + 1, 8) }}
                />
              ))}
            </div>
            <span>Mayor</span>
          </div>
        </div>
      )}
    </ReportCard>
  );
}
