import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterOptionsService } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { OrderSituationFilter } from '../shared/OrderSituationFilter';
import { defaultSituationIds } from '../../types/reports.types';

const ALL_VALUE = '__all__';

/**
 * Campos de "Más filtros" de Financiero. No reusa `OrderScopeFilters` a
 * propósito: esta pestaña mide dos universos distintos y la mitad de arriba
 * sale de `movements`, donde un movimiento solo tiene sede, cuenta, método de
 * pago y motivo. Canal, geografía y lista de precios viven en el pedido, así
 * que acá serían controles que no mueven la mitad de la pantalla.
 *
 * Reparto de cada campo:
 *   * Sede            -- las dos mitades
 *   * Método de pago  -- las dos mitades
 *   * Cuenta, Motivo  -- solo la caja (KPIs, flujo, y los dos gráficos)
 *   * Estado de pedido-- solo ganancia, margen y la tabla de productos
 * Está aclarado en la nota al pie de la barra.
 */
export function FinancialScopeFilters() {
  const { draft, setDraft } = useReportsFilters();

  const branches = useQuery({
    queryKey: ['filter_branches'],
    queryFn: filterOptionsService.getBranches,
    staleTime: 1000 * 60 * 10,
  });

  const businessAccounts = useQuery({
    queryKey: ['filter_business_accounts'],
    queryFn: filterOptionsService.getBusinessAccounts,
    staleTime: 1000 * 60 * 30,
  });

  const paymentMethods = useQuery({
    queryKey: ['filter_payment_methods'],
    queryFn: filterOptionsService.getPaymentMethods,
    staleTime: 1000 * 60 * 60,
  });

  const movementClasses = useQuery({
    queryKey: ['filter_movement_classes'],
    queryFn: filterOptionsService.getMovementClasses,
    staleTime: 1000 * 60 * 60,
  });

  return (
    <>
      {/* Sucursal */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Sucursal</span>
        <Select
          value={draft.branchId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ branchId: v === ALL_VALUE ? null : Number(v) })}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {branches.data?.map((b) => (
              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cuenta */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Cuenta</span>
        <Select
          value={draft.businessAccountId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ businessAccountId: v === ALL_VALUE ? null : Number(v) })}
        >
          <SelectTrigger className="h-9 w-[210px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {businessAccounts.data?.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.bank ? `${a.name} · ${a.bank}` : a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Método de pago */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Método de pago</span>
        <Select
          value={draft.paymentMethodId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ paymentMethodId: v === ALL_VALUE ? null : Number(v) })}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            {paymentMethods.data?.map((pm) => (
              <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Motivo del movimiento */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Motivo</span>
        <Select
          value={draft.movementClassId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ movementClassId: v === ALL_VALUE ? null : Number(v) })}
        >
          <SelectTrigger className="h-9 w-[190px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            {movementClasses.data?.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estado de pedido — mismo default que Ventas */}
      <OrderSituationFilter
        value={draft.situationIds}
        onChange={(ids) => setDraft({ situationIds: ids })}
        defaultIds={defaultSituationIds}
      />
    </>
  );
}
