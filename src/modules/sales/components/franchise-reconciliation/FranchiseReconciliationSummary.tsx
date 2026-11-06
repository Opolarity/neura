import { KpiCard } from "@/modules/reports/components/shared/KpiCard";
import { formatCurrency } from "@/shared/utils/currency";
import { FranchiseReconciliationTotals } from "../../types/FranchiseReconciliation.types";

interface Props {
  tenantReference: string | null;
  totals: FranchiseReconciliationTotals | null;
  loading: boolean;
}

export default function FranchiseReconciliationSummary({
  tenantReference,
  totals,
  loading,
}: Props) {
  if (!tenantReference) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Saldo esperado"
        value={totals?.expected ?? "—"}
        loading={loading}
        subtitle={
          totals
            ? `Enviado ${totals.sent} · Vendido ${totals.sold} · Devuelto ${totals.returned}`
            : undefined
        }
      />
      <KpiCard
        title="Stock físico"
        value={totals?.physical ?? "—"}
        loading={loading}
        subtitle="reportado por el franquiciado"
      />
      <KpiCard
        title="Diferencia"
        value={totals ? totals.expected - totals.physical : "—"}
        loading={loading}
        subtitle="referencia para revisar, no es un monto por cobrar"
      />
      <KpiCard
        title="Valor del saldo"
        value={totals ? formatCurrency(totals.balanceValue) : "—"}
        loading={loading}
        subtitle="precio vigente de cada línea"
      />
    </div>
  );
}
