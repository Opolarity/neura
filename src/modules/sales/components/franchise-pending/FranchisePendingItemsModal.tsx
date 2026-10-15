import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { LoaderContent } from "@/shared/components/loader";
import { formatDateDisplay } from "@/shared/utils/date";
import type {
  PendingReceptionItem,
  PendingReceptionRow,
} from "../../types/FranchisePendingReception.types";

interface FranchisePendingItemsModalProps {
  row: PendingReceptionRow | null;
  storeName: string;
  items: PendingReceptionItem[];
  loading: boolean;
  onClose: () => void;
}

/**
 * Detalle de un pedido: qué productos le faltan aceptar al franquiciado.
 * Las líneas pendientes vienen primero desde el SP.
 */
const FranchisePendingItemsModal = ({
  row,
  storeName,
  items,
  loading,
  onClose,
}: FranchisePendingItemsModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Pedido #{row?.orderId} · {storeName}
          </DialogTitle>
          <DialogDescription>
            {row
              ? `Enviado el ${formatDateDisplay(row.sentAt)} · ${row.linesPending} de ${row.linesTotal} líneas pendientes de aceptar`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderContent message="Cargando productos..." />
            </div>
          ) : (
            <Table containerClassName="max-h-[55vh]">
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Enviado</TableHead>
                  <TableHead className="text-center">Recibido</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      El pedido no tiene productos
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku ?? "-"}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {item.received ?? "-"}
                      </TableCell>
                      <TableCell>
                        {item.pending ? (
                          <Badge variant="warning">Pendiente</Badge>
                        ) : (item.received ?? 0) < item.quantity ? (
                          // Aceptada con menos unidades: la diferencia se
                          // confirma en la bandeja de cantidades, no aquí.
                          <Badge variant="info">Con diferencia</Badge>
                        ) : (
                          <Badge variant="success">Aceptado</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => row && navigate(`/sales/edit/${row.orderId}`)}
            disabled={!row}
          >
            Ir a la venta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FranchisePendingItemsModal;
