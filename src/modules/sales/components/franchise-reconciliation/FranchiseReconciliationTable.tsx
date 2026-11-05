import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import {
  FranchiseReconciliationRow,
  ReconciliationReviewReason,
  ReconciliationStatus,
} from "../../types/FranchiseReconciliation.types";

interface Props {
  rows: FranchiseReconciliationRow[];
  loading: boolean;
  hasFranchisee: boolean;
}

const STATUS_LABEL: Record<ReconciliationStatus, string> = {
  ok: "Cuadra",
  shortage: "Faltante",
  surplus: "Sobrante",
  review: "Revisar",
};

const STATUS_VARIANT: Record<ReconciliationStatus, BadgeProps["variant"]> = {
  ok: "success",
  shortage: "destructive-soft",
  surplus: "info",
  review: "warning",
};

const REVIEW_REASON_LABEL: Record<ReconciliationReviewReason, string> = {
  no_ledger: "Tiene stock, pero no figura en los envíos",
  oversold: "Vendido mayor que enviado",
  received_gap: "Recibido distinto de enviado",
  inactive_movement: "Tiene líneas con movimiento inactivo (saldo 0)",
};

const NUMERIC_COLUMNS = [
  "Enviado",
  "Recibido",
  "Vendido",
  "Devuelto",
  "En tránsito",
  "Saldo esperado",
  "Stock físico",
  "Diferencia",
  "Precio",
  "Valor del saldo",
];

// SKU + Producto + numéricas + Estado
const COL_SPAN = NUMERIC_COLUMNS.length + 3;

const formatPrice = (min: number | null, max: number | null) => {
  if (min === null || max === null) return "—";
  return min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)} – ${formatCurrency(max)}`;
};

const formatDifference = (value: number) => (value > 0 ? `+${value}` : `${value}`);

export default function FranchiseReconciliationTable({
  rows,
  loading,
  hasFranchisee,
}: Props) {
  const renderMessage = (message: string, withSpinner = false) => (
    <TableRow>
      <TableCell
        colSpan={COL_SPAN}
        className="text-center text-muted-foreground py-8"
      >
        {withSpinner ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {message}
          </div>
        ) : (
          message
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Producto</TableHead>
          {NUMERIC_COLUMNS.map((column) => (
            <TableHead key={column} className="text-right whitespace-nowrap">
              {column}
            </TableHead>
          ))}
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!hasFranchisee
          ? renderMessage("Selecciona un franquiciado para ver su conciliación")
          : loading
            ? renderMessage("Cargando conciliación...", true)
            : rows.length === 0
              ? renderMessage("No hay productos para mostrar")
              : rows.map((row) => (
                  <TableRow key={row.sku}>
                    <TableCell className="font-mono text-sm">{row.sku}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.productName || "—"}</div>
                      {row.variationName && (
                        <div className="text-xs text-muted-foreground">
                          {row.variationName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.sent}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.received}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.sold}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.returned}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.inTransit}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {row.expected}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.physical}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatDifference(row.difference)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatPrice(row.minPrice, row.maxPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(row.balanceValue)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[row.status]}
                        title={row.reviewReasons
                          .map((reason) => REVIEW_REASON_LABEL[reason])
                          .join(". ")}
                      >
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
      </TableBody>
    </Table>
  );
}
