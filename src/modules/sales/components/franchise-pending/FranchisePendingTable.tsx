import { Eye, Loader2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateDisplay } from "@/shared/utils/date";
import type {
  PendingReceptionRow,
  PendingReceptionStatus,
} from "../../types/FranchisePendingReception.types";

const PENDING_STATUS_LABEL: Record<PendingReceptionStatus, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  accepted: "Aceptado",
};

const PENDING_STATUS_VARIANT: Record<PendingReceptionStatus, BadgeProps["variant"]> = {
  pending: "warning",
  partial: "info",
  accepted: "success",
};

interface FranchisePendingTableProps {
  rows: PendingReceptionRow[];
  loading: boolean;
  onlyPending: boolean;
  getStoreName: (accountId: number, fallback: string) => string;
  onOpenOrder: (row: PendingReceptionRow) => void;
}

const COL_SPAN = 9;

const FranchisePendingTable = ({
  rows,
  loading,
  onlyPending,
  getStoreName,
  onOpenOrder,
}: FranchisePendingTableProps) => {
  const renderMessage = (message: string, withSpinner = false) => (
    <TableRow>
      <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground py-8">
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
          <TableHead>Franquiciado</TableHead>
          <TableHead>Pedido</TableHead>
          <TableHead>Enviado</TableHead>
          <TableHead className="text-center">Días esperando</TableHead>
          <TableHead className="text-center">Líneas pend.</TableHead>
          <TableHead className="text-center">Unid. pend.</TableHead>
          <TableHead className="text-right">Valor pend.</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? renderMessage("Cargando pedidos...", true)
          : rows.length === 0
            ? renderMessage(
                onlyPending
                  ? "No hay pedidos pendientes de aceptar"
                  : "No hay consignaciones enviadas con estos filtros",
              )
            : rows.map((row) => {
                const storeName = getStoreName(row.accountId, row.franchiseName);
                return (
                  <TableRow key={row.orderId}>
                    <TableCell>
                      <div className="font-medium">{storeName}</div>
                      {storeName !== row.franchiseName && (
                        <div className="text-xs text-muted-foreground">
                          {row.franchiseName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">#{row.orderId}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateDisplay(row.sentAt)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.daysWaiting}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.linesPending} / {row.linesTotal}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.unitsPending} / {row.unitsSent}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(row.valuePending)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PENDING_STATUS_VARIANT[row.status]}>
                        {PENDING_STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Ver productos del pedido"
                          onClick={() => onOpenOrder(row)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
      </TableBody>
    </Table>
  );
};

export default FranchisePendingTable;
