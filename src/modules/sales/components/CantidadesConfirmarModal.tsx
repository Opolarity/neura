import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatDateTime } from "@/shared/utils/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import {
  fetchQuantityAdjustments,
  resolveQuantityAdjustment,
  type QuantityAdjustmentFilter,
  type QuantityAdjustmentRow,
} from "../services/PendingQuantityAdjustments.service";
import { toastError } from "@/shared/utils/toastError";

interface CantidadesConfirmarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTERS: Array<{ value: QuantityAdjustmentFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Por confirmar" },
  { value: "approved", label: "Confirmadas" },
  { value: "rejected", label: "Rechazadas" },
];

const EMPTY_MESSAGE: Record<QuantityAdjustmentFilter, string> = {
  all: "No hay diferencias de cantidad registradas.",
  pending: "No hay diferencias pendientes de confirmación.",
  approved: "Todavía no hay diferencias confirmadas.",
  rejected: "No hay diferencias rechazadas.",
};

const STATUS_LABEL: Record<QuantityAdjustmentRow["status"], string> = {
  pending: "Por confirmar",
  approved: "Confirmada",
  rejected: "Rechazada",
};

const STATUS_VARIANT: Record<
  QuantityAdjustmentRow["status"],
  "success" | "pending" | "destructive"
> = {
  pending: "pending",
  approved: "success",
  rejected: "destructive",
};

export const CantidadesConfirmarModal = ({
  open,
  onOpenChange,
}: CantidadesConfirmarModalProps) => {
  const { toast } = useToast();
  const [adjustments, setAdjustments] = useState<QuantityAdjustmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<QuantityAdjustmentFilter>("pending");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const { rows, total: count } = await fetchQuantityAdjustments({
        status: filter,
        page,
        size,
      });
      setAdjustments(rows);
      setTotal(count);
    } catch (err) {
      console.error("Error cargando diferencias de cantidad:", err);
      toastError(err, "No se pudo cargar las diferencias de cantidad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadAdjustments();
  }, [open, filter, page, size]);

  const handleFilterChange = (value: QuantityAdjustmentFilter) => {
    if (value === filter) return;
    setPage(1);
    setFilter(value);
  };

  const handleResolve = async (
    adjustment: QuantityAdjustmentRow,
    action: "confirm" | "reject",
  ) => {
    setResolvingId(adjustment.id);
    try {
      await resolveQuantityAdjustment(adjustment.id, action);
      toast({
        title: action === "confirm" ? "Ajuste confirmado" : "Ajuste rechazado",
        description:
          action === "confirm"
            ? `El pedido ${adjustment.orderId} queda con ${adjustment.receivedQuantity} unidades de ${adjustment.sku}.`
            : `Se rechazó la diferencia del SKU ${adjustment.sku}. El franquiciado no podrá ingresar esa prenda.`,
        variant: action === "confirm" ? "success" : "default",
      });
      await loadAdjustments();
    } catch (err) {
      console.error("Error resolviendo la diferencia:", err);
      toastError(err, "No se pudo resolver la diferencia.", "Error al confirmar");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[980px]">
        <DialogHeader>
          <DialogTitle>Cantidades por confirmar</DialogTitle>
          <DialogDescription>
            El franquiciado recibió una cantidad distinta a la enviada. Al
            confirmar, el pedido queda con la cantidad recibida y las unidades
            que no llegaron vuelven al almacén.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? "default" : "outline"}
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando diferencias...
            </div>
          ) : adjustments.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {EMPTY_MESSAGE[filter]}
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
              <Table containerClassName="flex-1 min-h-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Franquiciado</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Enviado</TableHead>
                    <TableHead className="text-right">Recibido</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adjustment) => {
                    const difference =
                      adjustment.receivedQuantity - adjustment.sentQuantity;

                    return (
                      <TableRow key={adjustment.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTime(adjustment.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {adjustment.franchiseName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {adjustment.orderId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {adjustment.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          {adjustment.sentQuantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {adjustment.receivedQuantity}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            difference < 0 ? "text-destructive" : "text-warning"
                          }`}
                        >
                          {difference > 0 ? `+${difference}` : difference}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[adjustment.status]}>
                            {STATUS_LABEL[adjustment.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {adjustment.status === "pending" ? (
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                disabled={resolvingId === adjustment.id}
                                onClick={() =>
                                  handleResolve(adjustment, "confirm")
                                }
                              >
                                {resolvingId === adjustment.id ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Confirmando...
                                  </>
                                ) : (
                                  "Confirmar"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resolvingId === adjustment.id}
                                onClick={() =>
                                  handleResolve(adjustment, "reject")
                                }
                              >
                                Rechazar
                              </Button>
                            </div>
                          ) : (
                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                              {adjustment.processedAt
                                ? formatDateTime(adjustment.processedAt)
                                : "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="border-t">
                <PaginationBar
                  pagination={{ p_page: page, p_size: size, total }}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPage(1);
                    setSize(newSize);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
