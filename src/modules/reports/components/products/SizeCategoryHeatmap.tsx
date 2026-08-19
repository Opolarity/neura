import { useMemo, useRef, useState } from 'react';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import { formatCurrencyAxis, formatNumber, reportChartColors } from '../shared/reportChartUtils';
import type { SizeByCategoryItem } from '../../types/reports.types';

interface Props {
  data: SizeByCategoryItem[];
  loading: boolean;
}

// Orden natural de tallas de letra; las numéricas (28, 30, 32…) van después
// en orden ascendente, y cualquier otra etiqueta al final por alfabeto.
const LETTER_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function sizeSortKey(size: string): [number, number, string] {
  const letterIdx = LETTER_SIZE_ORDER.indexOf(size.toUpperCase());
  if (letterIdx !== -1) return [0, letterIdx, ''];
  const num = Number(size);
  if (!Number.isNaN(num)) return [1, num, ''];
  return [2, 0, size.toLowerCase()];
}

function compareSizes(a: string, b: string) {
  const [ga, na, sa] = sizeSortKey(a);
  const [gb, nb, sb] = sizeSortKey(b);
  return ga - gb || na - nb || sa.localeCompare(sb);
}

interface HeatmapCell {
  quantity: number;
  revenue: number;
}

interface HoveredCell {
  category: string;
  size: string;
  cell: HeatmapCell | null;
  /** Posición del anclaje, relativa al wrapper del gráfico. */
  x: number;
  y: number;
  /** true cuando la celda está muy arriba y el tooltip debe abrir hacia abajo
   *  para no cortarse con el overflow-hidden de la Card. */
  below: boolean;
}

export function SizeCategoryHeatmap({ data, loading }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const { sizes, rows, maxQuantity } = useMemo(() => {
    const sizeSet = new Set<string>();
    const byCategory = new Map<string, { total: number; cells: Map<string, HeatmapCell> }>();

    for (const d of data) {
      sizeSet.add(d.size_name);
      let row = byCategory.get(d.category_name);
      if (!row) {
        row = { total: 0, cells: new Map() };
        byCategory.set(d.category_name, row);
      }
      row.total += d.total_quantity;
      const prev = row.cells.get(d.size_name);
      row.cells.set(d.size_name, {
        quantity: (prev?.quantity ?? 0) + d.total_quantity,
        revenue: (prev?.revenue ?? 0) + d.total_revenue,
      });
    }

    const sortedSizes = [...sizeSet].sort(compareSizes);
    const sortedRows = [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total);
    const max = Math.max(0, ...data.map((d) => d.total_quantity));
    return { sizes: sortedSizes, rows: sortedRows, maxQuantity: max };
  }, [data]);

  return (
    <ReportCard title="Unidades vendidas por talla y categoría">
      {loading ? (
        <ChartLoading className="h-80" />
      ) : rows.length === 0 ? (
        <EmptyReportState>Sin ventas con talla asignada en el periodo</EmptyReportState>
      ) : (
        <div ref={wrapperRef} className="relative">
          {hovered && (
            <div
              className={`pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl ${
                hovered.below ? '' : '-translate-y-full'
              }`}
              style={{ left: hovered.x, top: hovered.below ? hovered.y + 6 : hovered.y - 6 }}
            >
              <p className="mb-1 whitespace-nowrap font-medium">
                {hovered.category} · Talla {hovered.size}
              </p>
              {hovered.cell ? (
                <div className="grid gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Unidades vendidas</span>
                    <span className="font-mono tabular-nums">{formatNumber(hovered.cell.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Ingresos por venta</span>
                    <span className="font-mono tabular-nums">{formatCurrencyAxis(hovered.cell.revenue)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin ventas en el periodo</p>
              )}
            </div>
          )}
          <div className="max-h-80 overflow-auto">
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-10 bg-background p-1 text-left font-medium text-muted-foreground">
                  Categoría
                </th>
                {sizes.map((s) => (
                  <th
                    key={s}
                    className="sticky top-0 z-[5] min-w-11 bg-background p-1 text-center font-medium text-muted-foreground"
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([category, row]) => (
                <tr key={category}>
                  <td
                    className="sticky left-0 z-[5] max-w-40 truncate bg-background p-1 pr-2 font-medium"
                    title={category}
                  >
                    {category}
                  </td>
                  {sizes.map((s) => {
                    const cell = row.cells.get(s);
                    const intensity =
                      cell && maxQuantity > 0
                        ? Math.max(0.08, cell.quantity / maxQuantity)
                        : 0;
                    return (
                      <td
                        key={s}
                        className="rounded-md p-0 text-center align-middle tabular-nums"
                        onMouseEnter={(e) => {
                          const wrapper = wrapperRef.current;
                          if (!wrapper) return;
                          const cellRect = e.currentTarget.getBoundingClientRect();
                          const wrapperRect = wrapper.getBoundingClientRect();
                          const rawX = cellRect.left + cellRect.width / 2 - wrapperRect.left;
                          const top = cellRect.top - wrapperRect.top;
                          const below = top < 96;
                          setHovered({
                            category,
                            size: s,
                            cell: cell ?? null,
                            x: Math.min(Math.max(rawX, 110), wrapperRect.width - 110),
                            y: below ? cellRect.bottom - wrapperRect.top : top,
                            below,
                          });
                        }}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          // Tinte del indigo de la paleta con alfa proporcional a
                          // las unidades vendidas; celdas sin ventas quedan en el
                          // fondo suave para que la matriz no se vea rota.
                          backgroundColor: cell
                            ? `${reportChartColors.indigo}${Math.round(intensity * 255)
                                .toString(16)
                                .padStart(2, '0')}`
                            : 'hsl(var(--muted))',
                        }}
                      >
                        <span
                          className={
                            intensity > 0.55
                              ? 'block px-1 py-1.5 font-medium text-white'
                              : 'block px-1 py-1.5'
                          }
                        >
                          {cell ? formatNumber(cell.quantity) : ''}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </ReportCard>
  );
}
