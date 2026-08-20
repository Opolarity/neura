import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
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
  fetchPendingPayments,
  confirmPendingPayment,
  type PendingPaymentFilter,
  type PendingPaymentRow,
} from "../services/PendingPayments.service";

interface PagosConfirmarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTERS: Array<{ value: PendingPaymentFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Por confirmar" },
  { value: "approved", label: "Confirmados" },
];

const EMPTY_MESSAGE: Record<PendingPaymentFilter, string> = {
  all: "No hay pagos registrados.",
  pending: "No hay pagos pendientes de confirmación.",
  approved: "Todavía no hay pagos confirmados.",
};

export const PagosConfirmarModal = ({
  open,
  onOpenChange,
}: PagosConfirmarModalProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<PendingPaymentFilter>("pending");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { rows, total: count } = await fetchPendingPayments({
        status: filter,
        page,
        size,
      });
      setPayments(rows);
      setTotal(count);
    } catch (err) {
      console.error("Error cargando pagos:", err);
      toast({
        title: "Error",
        description: "No se pudo cargar los pagos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadPayments();
  }, [open, filter, page, size]);

  const handleFilterChange = (value: PendingPaymentFilter) => {
    if (value === filter) return;
    setPage(1);
    setFilter(value);
  };

  const handleConfirm = async (payment: PendingPaymentRow) => {
    setConfirmingId(payment.id);
    try {
      await confirmPendingPayment(payment.id);
      toast({
        title: "Pago confirmado",
        description: `El pago de ${payment.franchiseName} por S/ ${payment.totalAmount.toFixed(2)} fue registrado correctamente.`,
        variant: "success",
      });
      await loadPayments();
    } catch (err) {
      console.error("Error confirmando pago:", err);
      toast({
        title: "Error al confirmar",
        description:
          err instanceof Error ? err.message : "No se pudo confirmar el pago.",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[880px]">
        <DialogHeader>
          <DialogTitle>Pagos por confirmar</DialogTitle>
          <DialogDescription>
            Revisa los comprobantes y confirma los pagos recibidos de
            franquiciados.
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
              Cargando pagos...
            </div>
          ) : payments.length === 0 ? (
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
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Comprobantes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(payment.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.franchiseName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.movementCode}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">
                        S/ {payment.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {payment.files.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Badge
                                variant="outline"
                                className="cursor-pointer gap-1 hover:bg-muted"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Archivo {i + 1}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "approved" ? "success" : "pending"
                          }
                        >
                          {payment.status === "approved"
                            ? "Confirmado"
                            : "Por confirmar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {payment.status === "approved" ? (
                          <span className="whitespace-nowrap text-sm text-muted-foreground">
                            {payment.processedAt
                              ? formatDateTime(payment.processedAt)
                              : "—"}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={confirmingId === payment.id}
                            onClick={() => handleConfirm(payment)}
                          >
                            {confirmingId === payment.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              "Confirmar"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
