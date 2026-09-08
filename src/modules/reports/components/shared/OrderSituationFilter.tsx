import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MultiSelect } from '@/shared/components/MultiSelect';
import { filterOptionsService } from '../../services/reports.service';
import type { OrderSituationOption } from '../../types/reports.types';

interface Props {
  /** Ids marcados hoy. `null` significa "el default de esta pestaña". */
  value: number[] | null;
  onChange: (ids: number[]) => void;
  /**
   * Qué se muestra marcado cuando `value` es null — es lo único que distingue
   * a Ventas de Productos. Pasar siempre una función de módulo
   * (`defaultSituationIds`, `defaultProductSituationIds`), nunca una arrow
   * inline: entra en las dependencias del useMemo.
   */
  defaultIds: (options: OrderSituationOption[]) => number[];
  label?: string;
}

/**
 * Filtro de situación de pedido. Vive en shared porque lo usan dos pestañas
 * con defaults distintos; lo que no puede divergir es el resto (el catálogo,
 * su caché, y el ancho del disparador, que cuadra los grids de filtros).
 */
export function OrderSituationFilter({
  value,
  onChange,
  defaultIds,
  label = 'Estado de pedido',
}: Props) {
  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  // `null` no se escribe en el draft hasta que el usuario toca el filtro: así
  // el backend sigue resolviendo su propio default.
  const options = useMemo(() => situations.data ?? [], [situations.data]);
  const selected = useMemo(() => value ?? defaultIds(options), [value, defaultIds, options]);

  return (
    <div className="flex flex-col gap-1 w-[200px]">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <MultiSelect
        className="h-9"
        options={options.map((s) => ({ label: s.name, value: s.id.toString() }))}
        value={selected.map((id) => id.toString())}
        onChange={(vals) => onChange(vals.map(Number))}
        placeholder="Ninguno"
        showSelectAll
        selectAllLabel="Todos"
        maxVisible={1}
      />
    </div>
  );
}
