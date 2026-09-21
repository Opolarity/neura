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
import { Input } from "@/components/ui/input";
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
import {
  AddSupplierPaymentPayload,
  SupplierPaymentRow,
} from "../../types/supplierPayments.types";

interface SupplierPaymentDialogProps {
  target: SupplierPaymentRow | null;
  paymentMethods: PaymentMethodOption[];
  saving: boolean;
  onClose: () => void;
  /** El comprobante viaja aparte: quien lo sube es el hook, no la pantalla. */
  onSubmit: (payload: AddSupplierPaymentPayload, voucher: File | null) => void;
}

/**
 * Registrar un pago contra un servicio.
 *
 * El saldo va delante y el importe arranca en él, porque lo normal es saldar:
 * quien paga a medias lo baja a mano, y quien paga entero no tiene que teclear
 * nada. Pasarse lo impide el SP, no esta pantalla — aquí solo se avisa antes.
 */
const SupplierPaymentDialog = ({
  target,
  paymentMethods,
  saving,
  onClose,
  onSubmit,
}: SupplierPaymentDialogProps) => {
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [voucher, setVoucher] = useState<File | null>(null);

  useEffect(() => {
    if (!target) return;
    setAmount(target.balance.toFixed(2));
    setMethodId("");
    setDescription("");
    setVoucher(null);
    // Solo al cambiar de servicio: `target` se reconstruye en cada recarga de
    // la lista, y depender del objeto borraría lo que se esté tecleando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.serviceId]);

  const method = useMemo(
    () => paymentMethods.find((m) => String(m.id) === methodId) ?? null,
    [paymentMethods, methodId],
  );

  const parsedAmount = Number(amount);
  const amountIsValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const excede = target ? parsedAmount > target.balance + 0.01 : false;

  // La cuenta sale del método: cada método de pago ya declara a dónde entra o
  // de dónde sale el dinero. Un método sin cuenta no puede registrar el
  // movimiento, así que se avisa en vez de dejar enviar.
  const cuentaFaltante = method !== null && method.businessAccountId === null;

  const puedeGuardar =
    target !== null &&
    amountIsValid &&
    !excede &&
    method !== null &&
    !cuentaFaltante &&
    !saving;

  const handleSubmit = () => {
    if (!target || !method?.businessAccountId || !puedeGuardar) return;
    onSubmit(
      {
        supplierQuotationId: target.quotationId,
        supplierServiceId: target.serviceId,
        amount: parsedAmount,
        paymentMethodId: method.id,
        businessAccountId: method.businessAccountId,
        description: description.trim() || null,
      },
      voucher,
    );
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {target?.supplierName} ·{" "}
            {target?.serviceDescription || `Servicio #${target?.serviceId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">
              Saldo pendiente
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(target?.balance ?? 0)}
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pago-importe">Importe</Label>
            <Input
              id="pago-importe"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {excede && (
              <p className="text-xs text-destructive">
                Es más de lo que se debe: el saldo es{" "}
                {formatCurrency(target?.balance ?? 0)}.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pago-metodo">Método de pago</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger id="pago-metodo">
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
                el movimiento. Asígnale una en Métodos de pago.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pago-descripcion">Descripción (opcional)</Label>
            <Textarea
              id="pago-descripcion"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Se guarda en el movimiento"
            />
          </div>

          <div className="grid gap-2">
            <Label>Comprobante (opcional)</Label>
            {/* Se SUBE, no se pega una url: el papel del banco está en el
                móvil de quien paga, y pedirle que primero lo hospede en algún
                sitio y luego pegue el enlace era pedirle que resolviera él el
                problema. */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!puedeGuardar}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPaymentDialog;
