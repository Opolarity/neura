import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { filterOptionsService } from '../../services/reports.service';
import type { InventoryDashboardState } from '../../hooks/useInventoryDashboard';

const ALL_VALUE = '__all__';
const BASE_THRESHOLD_OPTIONS = [5, 10, 20, 50];

/**
 * Listas con las que se puede valorizar el inventario. El catálogo trae
 * también listas de prueba; acá solo interesan las dos reales del negocio.
 * Minorista es la referencia del SP cuando no se manda nada.
 */
const VALUATION_PRICE_LIST_CODES = ['MIN', 'MAY'] as const;

/** Solo devuelve los campos de "Más filtros" de Stock — el contenedor
 * (caja, toggle, Limpiar, Aplicar) vive en ReportsFilterBar. Edita el
 * BORRADOR del hook: nada se recarga hasta el botón Aplicar. */
export function InventoryOptionsPanel({ dash }: { dash: InventoryDashboardState }) {
  const warehouses = dash.warehouses.data ?? [];
  const { extraDraft, setExtraDraft } = dash;

  // Mismo catálogo que usa el filtro de lista de precios de Ventas y Productos.
  const priceListsQuery = useQuery({
    queryKey: ['filter_price_lists'],
    queryFn: filterOptionsService.getPriceLists,
    staleTime: 1000 * 60 * 60,
  });
  const priceLists = (priceListsQuery.data ?? []).filter((pl) =>
    (VALUATION_PRICE_LIST_CODES as readonly string[]).includes(pl.code ?? ''),
  );
  const minorista = priceLists.find((pl) => pl.code === 'MIN');

  // El umbral configurado en Configuración > Negocio siempre está disponible
  // en la lista, aunque no sea uno de los valores sugeridos. T-269: puede no
  // estar configurado (null), y entonces simplemente no se agrega.
  const thresholdOptions = Array.from(
    new Set(
      dash.globalThreshold !== null
        ? [...BASE_THRESHOLD_OPTIONS, dash.globalThreshold]
        : BASE_THRESHOLD_OPTIONS,
    ),
  ).sort((a, b) => a - b);

  const draftThreshold = extraDraft.thresholdOverride ?? dash.globalThreshold;

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Almacén</span>
        <Select
          value={extraDraft.warehouseId != null ? String(extraDraft.warehouseId) : ALL_VALUE}
          onValueChange={(v) =>
            setExtraDraft({ warehouseId: v === ALL_VALUE ? undefined : Number(v) })
          }
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
          value={draftThreshold !== null ? String(draftThreshold) : undefined}
          onValueChange={(v) =>
            setExtraDraft({
              thresholdOverride: Number(v) === dash.globalThreshold ? undefined : Number(v),
            })
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Sin configurar" />
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

      {/*
        Lista con la que se valoriza el inventario. Afecta SOLO a las tarjetas
        de valorización: el resto de la pantalla cuenta unidades, que no
        dependen del precio. Sin elección se valoriza a Minorista, que es la
        referencia del SP; por eso el select la muestra seleccionada.
      */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Valorizar con</span>
        <Select
          value={
            extraDraft.valuationPriceListId != null
              ? String(extraDraft.valuationPriceListId)
              : minorista
                ? String(minorista.id)
                : undefined
          }
          onValueChange={(v) =>
            setExtraDraft({
              valuationPriceListId: minorista && Number(v) === minorista.id ? undefined : Number(v),
            })
          }
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Minorista" />
          </SelectTrigger>
          <SelectContent>
            {priceLists.map((pl) => (
              <SelectItem key={pl.id} value={String(pl.id)}>
                {pl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
