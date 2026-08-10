import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ban, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../utils";
import type { OrderRefund } from "../services";

interface RefundLine {
  id: string;
  paymentMethodId: string;
  amount: string;
}

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | null;
  /** Suma de pagos COMPLETADOS: es lo único devolvible */
  paidAmount: number;
  paymentMethods: any[];
  saving?: boolean;
  onConfirm: (refund: OrderRefund | null) => void;
}

const newLine = (): RefundLine => ({
  id: crypto.randomUUID(),
  paymentMethodId: "",
  amount: "",
});

export const CancelOrderModal = ({
  open,
  onOpenChange,
  orderId,
  paidAmount,
  paymentMethods,
  saving = false,
  onConfirm,
}: CancelOrderModalProps) => {
  const hasPayment = paidAmount > 0;
  const [lines, setLines] = useState<RefundLine[]>([]);

  // Al abrir con pago: una línea precargada con el total cobrado
  useEffect(() => {
    if (!open) return;
    setLines(hasPayment ? [{ ...newLine(), amount: paidAmount.toFixed(2) }] : []);
  }, [open, hasPayment, paidAmount]);

  const assigned = useMemo(
    () => lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0),
    [lines],
  );
  const remaining = useMemo(
    () => Number((paidAmount - assigned).toFixed(2)),
    [paidAmount, assigned],
  );

  const linesComplete = lines.every((l) => l.paymentMethodId && parseFloat(l.amount) > 0);
  const canConfirm = !hasPayment || (linesComplete && remaining === 0);

  // La cuenta la determina el método de pago (return_payments no guarda cuenta):
  // se muestra para que el usuario sepa de dónde saldrá el dinero.
  const accountNameFor = (paymentMethodId: string) => {
    const pm = paymentMethods.find((m) => m.id.toString() === paymentMethodId);
    return pm?.business_accounts?.name || pm?.business_account?.name || null;
  };

  const updateLine = (id: string, patch: Partial<RefundLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const handleConfirm = () => {
    if (!hasPayment) {
      onConfirm(null);
      return;
    }
    onConfirm({
      payment_methods: lines.map((l) => ({
        payment_method_id: Number(l.paymentMethodId),
        amount: parseFloat(l.amount),
        voucher_url: null,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Cancelar pedido
            {orderId && (
              <span className="text-muted-foreground font-normal text-sm">
                — #{orderId}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Se liberará el stock reservado del pedido.
          </DialogDescription>
        </DialogHeader>

        {!hasPayment ? (
          <Alert>
            <AlertDescription>
              Este pedido no tiene pagos cobrados, así que no hay dinero que
              devolver.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                El pedido tiene <strong>{formatCurrency(paidAmount)}</strong>{" "}
                cobrados. Indica por dónde sale la devolución.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {lines.map((line) => {
                const account = accountNameFor(line.paymentMethodId);
                return (
                  <div key={line.id} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Método de pago</Label>
                      <Select
                        value={line.paymentMethodId}
                        onValueChange={(v) => updateLine(line.id, { paymentMethodId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((pm) => (
                            <SelectItem key={pm.id} value={pm.id.toString()}>
                              {pm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {account && (
                        <p className="text-xs text-muted-foreground">
                          Cuenta: {account}
                        </p>
                      )}
                    </div>

                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.amount}
                        onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                      />
                    </div>

                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.id !== line.id))
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Otro método
              </Button>

              <span
                className={`text-sm ${remaining === 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}
              >
                {remaining === 0
                  ? "Devolución cuadrada"
                  : `Falta asignar ${formatCurrency(remaining)}`}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {hasPayment ? "Cancelar y devolver" : "Cancelar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
