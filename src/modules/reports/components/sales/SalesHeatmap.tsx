import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature as topoFeature } from 'topojson-client';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportCard, ReportSelect, ChartLoading, EmptyReportState } from '../shared/ReportScaffold';
import { formatCurrency } from '@/shared/utils/currency';
import { salesService } from '../../services/reports.service';
import type { HeatmapMetric, ReportsFilters, SalesGeoHeatmapItem } from '../../types/reports.types';

import deptTopo from '@/assets/geo/peru-departments.json';
import provTopo from '@/assets/geo/peru-provinces.json';

// Convertir TopoJSON de provincias → GeoJSON una sola vez al cargar el módulo
const PROV_FEATURES = (
  topoFeature(provTopo as any, (provTopo as any).objects['peru_provincial_simple']) as any
).features as Array<{ properties: Record<string, string>; geometry: { coordinates: unknown } }>;

const METRIC_OPTIONS: Array<{ value: HeatmapMetric; label: string }> = [
  { value: 'total_revenue', label: 'Ingresos' },
  { value: 'order_count',   label: 'Pedidos'  },
];

// Recorre coordenadas anidadas de un GeoJSON
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
  const maxExtent = Math.max(maxLon - minLon, maxLat - minLat, 0.1);
  const scale = Math.round((1700 * 18) / maxExtent * 0.65);
  return { center: [centerLon, centerLat], scale };
}

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'hsl(221,30%,93%)';
  const t = Math.min(value / max, 1);
  return `hsl(221,83%,${Math.round(92 - t * 50)}%)`;
}

interface DrillLevel { geoMap: string; label: string; id: number }

interface SalesHeatmapProps { filters: ReportsFilters }

export function SalesHeatmap({ filters }: SalesHeatmapProps) {
  const [metric, setMetric]             = useState<HeatmapMetric>('total_revenue');
  const [selectedDept, setSelectedDept] = useState<DrillLevel | null>(null);
  const [selectedProv, setSelectedProv] = useState<DrillLevel | null>(null);
  const [hovered, setHovered]           = useState<SalesGeoHeatmapItem | null>(null);

  // TopoJSON de distritos cargado de forma lazy (solo cuando se necesita)
  const [distTopo, setDistTopo] = useState<any>(null);
  useEffect(() => {
    if (selectedProv && !distTopo) {
      import('@/assets/geo/peru-districts.json').then((mod) => setDistTopo(mod.default ?? mod));
    }
  }, [selectedProv, distTopo]);

  // Features de distritos derivadas del TopoJSON lazy
  const distFeatures = useMemo(() => {
    if (!distTopo) return [];
    return (topoFeature(distTopo, distTopo.objects['peru_distritos']) as any)
      .features as Array<{ properties: Record<string, string>; geometry: { coordinates: unknown } }>;
  }, [distTopo]);

  // Nivel activo
  const view = selectedProv ? 'districts' : selectedDept ? 'provinces' : 'national';

  // Queries por nivel
  const nationalQuery = useQuery({
    queryKey: ['rpt_geo_heatmap_national', filters],
    queryFn:  () => salesService.getGeoHeatmap(filters),
    staleTime: 1000 * 60 * 5,
  });
  const deptQuery = useQuery({
    queryKey: ['rpt_geo_heatmap_dept', filters, selectedDept?.id],
    queryFn:  () => salesService.getGeoHeatmap(filters, selectedDept!.id),
    enabled:  !!selectedDept,
    staleTime: 1000 * 60 * 5,
  });
  const provQuery = useQuery({
    queryKey: ['rpt_geo_heatmap_prov', filters, selectedProv?.id],
    queryFn:  () => salesService.getGeoHeatmap(filters, selectedDept!.id, selectedProv!.id),
    enabled:  !!selectedProv,
    staleTime: 1000 * 60 * 5,
  });

  const activeData = view === 'districts' ? (provQuery.data  ?? [])
                   : view === 'provinces'  ? (deptQuery.data  ?? [])
                   :                         (nationalQuery.data ?? []);
  const isLoading  = view === 'districts' ? (provQuery.isLoading  || !distTopo)
                   : view === 'provinces'  ? deptQuery.isLoading
                   :                         nationalQuery.isLoading;

  const dataMap = useMemo(() => {
    const map = new Map<string, SalesGeoHeatmapItem>();
    for (const item of activeData) { if (item.geo_map) map.set(item.geo_map, item); }
    return map;
  }, [activeData]);

  const maxValue = useMemo(
    () => activeData.length === 0 ? 0 : Math.max(...activeData.map((d) => d[metric] as number)),
    [activeData, metric],
  );

  // Proyección dinámica según nivel
  const projectionConfig = useMemo(() => {
    if (selectedProv) {
      const features = distFeatures.filter((f) => f.properties['NOMBPROV'] === selectedProv.geoMap);
      return fitProjection(features);
    }
    if (selectedDept) {
      const features = PROV_FEATURES.filter((f) => f.properties['FIRST_NOMB'] === selectedDept.geoMap);
      return fitProjection(features);
    }
    return { center: [-75.0, -9.5] as [number, number], scale: 1700 };
  }, [selectedDept, selectedProv, distFeatures]);

  const mapKey = selectedProv
    ? `dist-${selectedProv.geoMap}`
    : selectedDept
    ? `prov-${selectedDept.geoMap}`
    : 'national';

  // Handlers de click
  const handleDeptClick = useCallback((props: Record<string, string>) => {
    const geoMap = props['NOMBDEP'];
    const item = dataMap.get(geoMap);
    if (!item?.state_id) return;
    setSelectedDept({ geoMap, label: item.label, id: item.state_id });
    setHovered(null);
  }, [dataMap]);

  const handleProvClick = useCallback((props: Record<string, string>) => {
    const geoMap = props['NOMBPROV'];
    const item = dataMap.get(geoMap);
    if (!item?.city_id) return;
    setSelectedProv({ geoMap, label: item.label, id: item.city_id });
    setHovered(null);
  }, [dataMap]);

  const goBack = useCallback(() => {
    if (selectedProv) { setSelectedProv(null); setHovered(null); }
    else { setSelectedDept(null); setHovered(null); }
  }, [selectedProv]);

  const goNational = useCallback(() => {
    setSelectedDept(null); setSelectedProv(null); setHovered(null);
  }, []);

  // Breadcrumb
  const breadcrumb = (
    <div className="flex items-center gap-1 min-w-0">
      {(selectedDept || selectedProv) && (
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs shrink-0" onClick={goBack}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
      )}
      {selectedDept && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <button onClick={goNational} className="hover:text-foreground transition-colors shrink-0">Perú</button>
          <span>/</span>
          {selectedProv ? (
            <>
              <button onClick={() => { setSelectedProv(null); setHovered(null); }} className="hover:text-foreground transition-colors truncate max-w-24">
                {selectedDept.label}
              </button>
              <span>/</span>
              <span className="font-semibold text-foreground truncate max-w-28">{selectedProv.label}</span>
            </>
          ) : (
            <span className="font-semibold text-foreground truncate max-w-36">{selectedDept.label}</span>
          )}
        </div>
      )}
      {!selectedDept && (
        <span className="text-base font-semibold">Mapa de calor — Ventas por departamento</span>
      )}
    </div>
  );

  return (
    <ReportCard
      title={breadcrumb}
      actions={
        <ReportSelect value={metric} onValueChange={setMetric} options={METRIC_OPTIONS} className="w-32" />
      }
    >
      {isLoading ? (
        <ChartLoading className="h-[480px]" />
      ) : activeData.length === 0 && view !== 'districts' ? (
        <EmptyReportState>Sin datos en el periodo seleccionado</EmptyReportState>
      ) : (
        <div className="relative">
          <ComposableMap
            key={mapKey}
            projection="geoMercator"
            projectionConfig={projectionConfig}
            style={{ width: '100%', height: '480px' }}
          >
            {view === 'districts' ? (
              <Geographies geography={distTopo}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties['NOMBPROV'] === selectedProv!.geoMap)
                    .map((geo) => {
                      const geoMap = geo.properties['NOMBDIST'] as string;
                      const item   = dataMap.get(geoMap);
                      const value  = item ? (item[metric] as number) : 0;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getColor(value, maxValue)}
                          stroke="white"
                          strokeWidth={0.3}
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
            ) : view === 'provinces' ? (
              <Geographies geography={provTopo}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties['FIRST_NOMB'] === selectedDept!.geoMap)
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
                            hover:   { outline: 'none', opacity: 0.85, cursor: item?.city_id ? 'pointer' : 'default' },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={() => setHovered(item ?? { geo_map: geoMap, label: geoMap, order_count: 0, total_revenue: 0 })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => handleProvClick(geo.properties as Record<string, string>)}
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

          {/* Leyenda */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Menor</span>
            <div className="flex h-3 w-32 overflow-hidden rounded">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ flex: 1, background: getColor(i + 1, 8) }} />
              ))}
            </div>
            <span>Mayor</span>
          </div>
        </div>
      )}
    </ReportCard>
  );
}
