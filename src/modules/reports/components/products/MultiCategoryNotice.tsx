import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Aviso de los gráficos que agrupan por categoría. Un producto puede
 * pertenecer a varias, y estos reportes lo cuentan entero en cada una: el
 * total del gráfico es mayor que las unidades realmente vendidas. Es una
 * advertencia metodológica permanente, no un estado, así que va en texto
 * secundario y sin color propio.
 */
export function MultiCategoryNotice() {
  return (
    <span className="inline-flex items-start gap-1">
      <span>
        Un producto puede pertenecer a varias categorías y sus unidades se cuentan en cada
        una, así que el total supera las unidades realmente vendidas.
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Por qué los totales por categoría no cuadran"
            className="inline-flex shrink-0 align-middle"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-2 text-sm text-foreground">
          <p>
            Cada producto se asigna a todas las categorías que le corresponden (por ejemplo
            “Polos” y “Nuevos”). Los gráficos por categoría suman las unidades completas del
            producto en cada una de ellas.
          </p>
          <p>
            Por eso el total de este gráfico es mayor que las unidades vendidas del periodo.
            Para el total real usa el Pareto de productos o el reporte de Ventas, que cuentan
            cada producto una sola vez.
          </p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
