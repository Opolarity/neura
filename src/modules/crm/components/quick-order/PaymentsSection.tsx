import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/modules/sales/types";
import { formatCurrency } from "@/shared/utils/currency";
import type { QuickOrderChange, QuickOrderPayment, QuickOrderTotals } from "../../types/quickOrder.types";
import { PaymentEntryCard } from "./PaymentEntryCard";

interface Props {
  payments: QuickOrderPayment[];
  changeEntries: QuickOrderChange[];
  totals: QuickOrderTotals;
  methods: PaymentMethod[];
  accounts: { id: number; name: string }[];
  needsAccount: (paymentMethodId: number | null) => boolean;
  accountFor: (paymentMethodId: number | null) => number | null;
  onPaymentsChange: (payments: QuickOrderPayment[]) => void;
  onAddPayment: () => void;
  onChangeEntriesChange: (entries: QuickOrderChange[]) => void;
  onAddChangeEntry: () => void;
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
  </div>
);

/**
 * Pagos y vuelto del pedido, como en Añadir venta: se pueden registrar varios
 * pagos (Yape + efectivo…) y, si lo pagado supera el total, el vuelto que se
 * entregó, que no puede pasar del vuelto calculado.
 */
export const PaymentsSection = ({
  payments,
  changeEntries,
  totals,
  methods,
  accounts,
  needsAccount,
  accountFor,
  onPaymentsChange,
  onAddPayment,
  onChangeEntriesChange,
  onAddChangeEntry,
}: Props) => {
  const changeLeft = Math.round((totals.change - totals.changeGiven) * 100) / 100;

  return (
    <div className="flex flex-col gap-2">
      {methods.length === 0 && (
        <p className="rounded-md bg-warning-soft px-2 py-1.5 text-[11px] text-warning-soft-foreground">
          Este canal no tiene métodos de pago vinculados. Vincúlalos en Ventas &gt; Canales de venta.
        </p>
      )}

      {payments.map((p, i) => (
        <PaymentEntryCard
          key={p.id}
          entry={p}
          label={payments.length > 1 ? `Pago ${i + 1}` : "Pago"}
          methods={methods}
          accounts={accounts}
          needsAccount={needsAccount}
          accountFor={accountFor}
          withOperationCode
          onChange={(next) => onPaymentsChange(payments.map((x) => (x.id === p.id ? next : x)))}
          onRemove={() => onPaymentsChange(payments.filter((x) => x.id !== p.id))}
        />
      ))}

      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onAddPayment}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        {payments.length ? "Agregar otro pago" : "Agregar pago"}
      </Button>

      {payments.length > 0 && (
        <div className="flex flex-col gap-0.5 rounded-md bg-muted px-2 py-1.5 text-xs">
          <Row label="Pagado" value={formatCurrency(totals.paid)} />
          {totals.pending > 0 && <Row label="Falta" value={formatCurrency(totals.pending)} strong />}
          {totals.change > 0 && <Row label="Vuelto a entregar" value={formatCurrency(totals.change)} strong />}
        </div>
      )}

      {/* Vuelto: solo existe si se pagó de más. */}
      {(totals.change > 0 || changeEntries.length > 0) && (
        <div className="flex flex-col gap-2 border-t pt-2">
          <p className="text-xs font-semibold">Vuelto</p>
          {changeEntries.map((e, i) => (
            <PaymentEntryCard
              key={e.id}
              entry={e}
              label={changeEntries.length > 1 ? `Vuelto ${i + 1}` : "Vuelto"}
              methods={methods}
              accounts={accounts}
              needsAccount={needsAccount}
              accountFor={accountFor}
              withOperationCode={false}
              onChange={(next) => onChangeEntriesChange(changeEntries.map((x) => (x.id === e.id ? next : x)))}
              onRemove={() => onChangeEntriesChange(changeEntries.filter((x) => x.id !== e.id))}
            />
          ))}
          {totals.changeGiven > totals.change && (
            <p className="text-[11px] text-destructive" role="alert">
              El vuelto registrado ({formatCurrency(totals.changeGiven)}) supera el calculado (
              {formatCurrency(totals.change)}).
            </p>
          )}
          {changeLeft > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onAddChangeEntry}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Registrar vuelto ({formatCurrency(changeLeft)})
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
