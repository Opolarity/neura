import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";
import {
  fetchPendingPayments,
  confirmPendingPayment,
  type PendingPaymentRow,
} from "../services/PendingPayments.service";

interface PagosConfirmarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PagosConfirmarModal = ({
  open,
  onOpenChange,
}: PagosConfirmarModalProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingPayments();
      setPayments(data);
    } catch (err) {
      console.error("Error cargando pagos pendientes:", err);
      toast({
        title: "Error",
        description: "No se pudo cargar los pagos pendientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadPayments();
  }, [open]);

  const handleConfirm = async (payment: PendingPaymentRow) => {
    setConfirmingId(payment.id);
    try {
      await confirmPendingPayment(payment.id);
      toast({
        title: "Pago confirmado",
        description: `El pago de ${payment.franchiseName} por S/ ${payment.totalAmount.toFixed(2)} fue registrado correctamente.`,
      });
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));
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
      <DialogContent className="sm:max-w-[780px]">
        <DialogHeader>
          <DialogTitle>Pagos por confirmar</DialogTitle>
          <DialogDescription>
            Revisa los comprobantes y confirma los pagos recibidos de
            franquiciados.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando pagos pendientes...
            </div>
          ) : payments.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No hay pagos pendientes de confirmación.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Franquiciado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Comprobantes</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.franchiseName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.movementCode}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
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
                      <TableCell className="text-center">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
