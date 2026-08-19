import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InventoryDashboardState } from '../../hooks/useInventoryDashboard';

const ALL_VALUE = '__all__';
const BASE_THRESHOLD_OPTIONS = [5, 10, 20, 50];

/** Solo devuelve los campos de "Más filtros" de Stock — el contenedor
 * (caja, toggle, Limpiar, Aplicar) vive en ReportsFilterBar. */
export function InventoryOptionsPanel({ dash }: { dash: InventoryDashboardState }) {
  const warehouses = dash.warehouses.data ?? [];

  // El umbral configurado en Configuración > Negocio siempre está disponible
  // en la lista, aunque no sea uno de los valores sugeridos.
  const thresholdOptions = Array.from(
    new Set([...BASE_THRESHOLD_OPTIONS, dash.globalThreshold]),
  ).sort((a, b) => a - b);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Almacén</span>
        <Select
          value={dash.warehouseId != null ? String(dash.warehouseId) : ALL_VALUE}
          onValueChange={(v) => dash.setWarehouseId(v === ALL_VALUE ? undefined : Number(v))}
        >
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los almacenes</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Umbral stock bajo</span>
        <Select
          value={String(dash.threshold)}
          onValueChange={(v) =>
            dash.setThresholdOverride(Number(v) === dash.globalThreshold ? undefined : Number(v))
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {thresholdOptions.map((t) => (
              <SelectItem key={t} value={String(t)}>
                ≤ {t} unidades{t === dash.globalThreshold ? ' (global)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
