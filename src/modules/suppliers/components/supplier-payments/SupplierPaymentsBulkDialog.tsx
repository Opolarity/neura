import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/shared/utils/currency";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { PaymentMethodOption } from "../../hooks/useSupplierPayments";
import { SupplierPaymentRow } from "../../types/supplierPayments.types";

interface SupplierPaymentsBulkDialogProps {
  open: boolean;
  rows: SupplierPaymentRow[];
  total: number;
  paymentMethods: PaymentMethodOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    paymentMethodId: number,
    businessAccountId: number,
    description: string | null,
    /** Uno para todo el lote: es un solo desembolso. */
    voucher: File | null,
  ) => void;
}

/**
 * Saldar de una vez lo marcado.
 *
 * Cada servicio se paga por TODO su saldo: el lote es para cerrar lo que se le
 * debe a un taller, y pedir un importe por fila lo convertiría en un
 * formulario que nadie quiere rellenar. Para pagar a medias está el diálogo de
 * uno solo.
 *
 * Antes de confirmar se enseña qué se va a pagar, agrupado por proveedor. No
 * es adorno: marcar deprisa mezcla talleres sin querer, y un pago con el
 * método equivocado no se deshace desde aquí.
 */
const SupplierPaymentsBulkDialog = ({
  open,
  rows,
  total,
  paymentMethods,
  saving,
  onClose,
  onSubmit,
}: SupplierPaymentsBulkDialogProps) => {
  const [methodId, setMethodId] = useState("");
  const [description, setDescription] = useState("");
  const [voucher, setVoucher] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setMethodId("");
    setDescription("");
    setVoucher(null);
  }, [open]);

  const method = useMemo(
    () => paymentMethods.find((m) => String(m.id) === methodId) ?? null,
    [paymentMethods, methodId],
  );

  // Por proveedor, que es como se mira un desembolso: a quién y cuánto.
  const porProveedor = useMemo(() => {
    const mapa = new Map<string, { total: number; count: number }>();
    rows.forEach((row) => {
      const actual = mapa.get(row.supplierName) ?? { total: 0, count: 0 };
      mapa.set(row.supplierName, {
        total: actual.total + row.balance,
        count: actual.count + 1,
      });
    });
    return [...mapa.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [rows]);

  const cuentaFaltante = method !== null && method.businessAccountId === null;
  const puedeGuardar =
    rows.length > 0 && method !== null && !cuentaFaltante && !saving;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar {rows.length} servicios</DialogTitle>
          <DialogDescription>
            Cada uno se salda por completo. Es una sola operación: si algo
            falla, no se registra ningún pago.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {porProveedor.map(([supplierName, resumen]) => (
              <div
                key={supplierName}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {supplierName}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {resumen.count}{" "}
                    {resumen.count === 1 ? "servicio" : "servicios"}
                  </div>
                </div>
                <span className="text-sm tabular-nums">
                  {formatCurrency(resumen.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Mezclar talleres no está prohibido —son movimientos distintos, uno
              por servicio— pero casi siempre es un descuido, así que se dice. */}
          {porProveedor.length > 1 && (
            <p className="text-warning text-xs">
              Hay {porProveedor.length} proveedores en la selección. Se
              registrará un pago por servicio, todos con el mismo método.
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total a pagar</span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lote-metodo">Método de pago</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger id="lote-metodo">
                <SelectValue placeholder="Elegir método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                    {option.businessAccountName
                      ? ` · ${option.businessAccountName}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cuentaFaltante && (
              <p className="text-xs text-destructive">
                Este método no tiene cuenta asociada, así que no puede registrar
                los movimientos. Asígnale una en Métodos de pago.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Comprobante (opcional)</Label>
            {/* Uno para todo el lote: una transferencia por varios servicios
                lleva un solo papel, y la url se repite en cada pago para que
                cada fila pueda enseñarlo por su cuenta. */}
            {voucher ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {voucher.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setVoucher(null)}
                  aria-label="Quitar el comprobante"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    setVoucher(file);
                  }}
                />
                <span className="border-input inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Upload className="h-4 w-4" />
                  Adjuntar comprobante
                </span>
              </label>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lote-descripcion">Descripción (opcional)</Label>
            <Textarea
              id="lote-descripcion"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Se guarda en todos los movimientos del lote"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            disabled={!puedeGuardar}
            onClick={() => {
              if (!method?.businessAccountId || !puedeGuardar) return;
              onSubmit(
                method.id,
                method.businessAccountId,
                description.trim() || null,
                voucher,
              );
            }}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Pagar {formatCurrency(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPaymentsBulkDialog;
