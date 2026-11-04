import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/shared/hooks/use-toast";
import { formatDateTime } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import { useFranchiseSaleAdjustment } from "../hooks/useFranchiseSaleAdjustment";
import type { FranchiseLineSale } from "../types/FranchiseSaleAdjustment.types";

interface AjustarPrecioVentaModalProps {
  /** Línea de consignación a revisar; null mantiene el modal cerrado. */
  orderProductId: number | null;
  productName: string;
  onClose: () => void;
  /** Se llama tras cada ajuste, para refrescar el listado. */
  onAdjusted: () => void;
}

const formatPrice = (value: number): string => `S/ ${value.toFixed(2)}`;

export const AjustarPrecioVentaModal = ({
  orderProductId,
  productName,
  onClose,
  onAdjusted,
}: AjustarPrecioVentaModalProps) => {
  const { sales, adjust } = useFranchiseSaleAdjustment(orderProductId);
  const [selected, setSelected] = useState<FranchiseLineSale | null>(null);
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  // Misma clave en cada reintento de los mismos datos: si el primer intento quedó
  // aplicado solo en el ERP del franquiciado, el backend termina ese ajuste.
  const adjustmentKey = useRef("");

  const resetKey = () => {
    adjustmentKey.current = crypto.randomUUID();
  };

  const resetForm = useCallback(() => {
    setSelected(null);
    setPrice("");
    setReason("");
    resetKey();
  }, []);

  useEffect(() => {
    if (orderProductId !== null) resetForm();
  }, [orderProductId, resetForm]);

  const handleSelect = (sale: FranchiseLineSale) => {
    setSelected(sale);
    setPrice(sale.unitNet.toFixed(2));
    setReason("");
    resetKey();
  };

  const newPrice = Number(price);
  const validPrice =
    price.trim() !== "" &&
    Number.isFinite(newPrice) &&
    newPrice >= 0 &&
    (!selected || newPrice <= selected.unitPrice);
  const canSubmit =
    !!selected &&
    validPrice &&
    newPrice !== selected.unitNet &&
    reason.trim() !== "" &&
    !adjust.isPending;

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;

    try {
      await adjust.mutateAsync({
        saleId: selected.id,
        newUnitPrice: newPrice,
        reason: reason.trim(),
        adjustmentKey: adjustmentKey.current,
      });
      toast({
        title: "Precio ajustado",
        description: `La venta quedó en ${formatPrice(newPrice)} por unidad.`,
      });
      resetForm();
      onAdjusted();
    } catch (error) {
      toastError(error, "No se pudo ajustar el precio");
    }
  };

  const data = sales.data;

  return (
    <Dialog
      open={orderProductId !== null}
      onOpenChange={(open) => {
        if (!open && !adjust.isPending) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Ajustar precio de venta</DialogTitle>
          <DialogDescription>
            {productName}
            {data?.franchiseName ? ` · ${data.franchiseName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {data && !data.statusAvailable && (
            <p className="text-sm text-muted-foreground">
              No se pudo consultar el ERP del franquiciado. Si la venta ya está pagada, se
              rechazará al guardar.
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio base</TableHead>
                <TableHead className="text-right">Precio cobrado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando ventas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {sales.error instanceof Error
                      ? sales.error.message
                      : "No se pudieron cargar las ventas."}
                  </TableCell>
                </TableRow>
              ) : !data || data.sales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Esta línea no tiene ventas reportadas.
                  </TableCell>
                </TableRow>
              ) : (
                data.sales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    data-state={selected?.id === sale.id ? "selected" : undefined}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(sale.saleDate)}
                    </TableCell>
                    <TableCell>
                      {sale.franchiseOrderId ? `#${sale.franchiseOrderId}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(sale.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(sale.unitNet)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(sale.amount)}
                    </TableCell>
                    <TableCell>
                      {sale.blockedLabel ? (
                        <Badge variant="secondary">{sale.blockedLabel}</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Ajustar precio"
                          disabled={adjust.isPending}
                          onClick={() => handleSelect(sale)}
                        >
                          <SquarePen className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {selected && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                <Label htmlFor="sale-adjustment-price">Precio final por unidad</Label>
                <Input
                  id="sale-adjustment-price"
                  type="number"
                  min={0}
                  max={selected.unitPrice}
                  step="0.01"
                  value={price}
                  onChange={(event) => {
                    setPrice(event.target.value);
                    resetKey();
                  }}
                />
                {validPrice ? (
                  <p className="text-sm text-muted-foreground">
                    Monto de la venta: {formatPrice(selected.amount)} a{" "}
                    {formatPrice(newPrice * selected.quantity)}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">
                    Ingresa un precio entre S/ 0.00 y {formatPrice(selected.unitPrice)}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-adjustment-reason">Motivo</Label>
                <Textarea
                  id="sale-adjustment-reason"
                  rows={2}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    resetKey();
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={adjust.isPending} onClick={onClose}>
            Cerrar
          </Button>
          {selected && (
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {adjust.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar ajuste
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
