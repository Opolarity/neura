import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/shared/utils/currency";
import { PayableDetail } from "../../hooks/useSupplierPayments";
import { SupplierPaymentRow } from "../../types/supplierPayments.types";
import SupplierPaymentsTable from "./SupplierPaymentsTable";

interface SupplierPayableDetailDialogProps {
  detail: PayableDetail | null;
  onClose: () => void;
  /** Pagar un servicio (también a medias), desde su fila. */
  onPayService: (row: SupplierPaymentRow) => void;
}

/**
 * El ojo de Pagos y cobros › Proveedores: los servicios que se le deben al
 * taller en esa OP, con cómo sale cada importe.
 */
const SupplierPayableDetailDialog = ({ detail, onClose, onPayService }: SupplierPayableDetailDialogProps) => (
  <Dialog open={detail !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-[min(96vw,1200px)]">
      <DialogHeader>
        <DialogTitle>
          {detail?.row.supplierName} · {detail?.row.productionOrderCode ?? "Sin OP"}
        </DialogTitle>
        <DialogDescription>
          Por pagar {formatCurrency(detail?.row.balance ?? 0)} · pagado {formatCurrency(detail?.row.paid ?? 0)} de{" "}
          {formatCurrency(detail?.row.payable ?? 0)} exigible
        </DialogDescription>
      </DialogHeader>
      {detail?.loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando servicios...
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-auto rounded-md border">
          <SupplierPaymentsTable rows={detail?.services ?? []} onPay={onPayService} />
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default SupplierPayableDetailDialog;
