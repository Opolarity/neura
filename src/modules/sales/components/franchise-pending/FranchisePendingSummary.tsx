import { formatCurrency } from "@/shared/utils/currency";
import type { PendingReceptionSummary } from "../../types/FranchisePendingReception.types";

interface FranchisePendingSummaryProps {
  summary: PendingReceptionSummary;
  loading: boolean;
}

const plural = (n: number, singular: string, pluralForm: string) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

/**
 * Contador global: lo que Ventas tiene que atacar. No depende de los filtros
 * de la tabla, para que siempre diga cuánto falta en total.
 */
const FranchisePendingSummary = ({ summary, loading }: FranchisePendingSummaryProps) => {
  if (loading && summary.ordersPending === 0) {
    return <p className="text-sm text-muted-foreground">Contando pendientes...</p>;
  }

  if (summary.ordersPending === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ningún franquiciado tiene mercadería pendiente de aceptar.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      <span className="text-base font-semibold text-foreground">
        {plural(summary.franchiseesPending, "franquiciado", "franquiciados")} /{" "}
        {plural(summary.ordersPending, "pedido", "pedidos")} pendientes de aceptar
      </span>
      {" · "}
      {plural(summary.unitsPending, "unidad", "unidades")} ·{" "}
      {formatCurrency(summary.valuePending)}
    </p>
  );
};

export default FranchisePendingSummary;
