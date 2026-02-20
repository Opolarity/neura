import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, DollarSign, Calculator, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { POSSession, ClosePOSSessionRequest } from "../../types/POS.types";
import { formatCurrency } from "@/shared/utils/currency";

interface POSCloseSessionModalProps {
  isOpen: boolean;
  session: POSSession | null;
  totalSales: number;
  isClosing: boolean;
  onClose: (request: ClosePOSSessionRequest) => Promise<unknown>;
  onCancel: () => void;
}

export default function POSCloseSessionModal({
  isOpen,
  session,
  totalSales,
  isClosing,
  onClose,
  onCancel,
}: POSCloseSessionModalProps) {
  // Calculate expected amount (opening + sales)
  const expectedAmount = useMemo(() => {
    if (!session) return 0;
    return session.openingAmount + totalSales;
  }, [session, totalSales]);

  // Editable closing amount (initialized with expected)
  const [closingAmount, setClosingAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Initialize closing amount when modal opens or expected changes
  useEffect(() => {
    if (isOpen && expectedAmount > 0) {
      setClosingAmount(expectedAmount.toFixed(2));
    } else if (isOpen) {
      setClosingAmount("0.00");
    }
  }, [isOpen, expectedAmount]);

  // Reset notes when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes("");
    }
  }, [isOpen]);

  // Calculate difference
  const difference = useMemo(() => {
    const closing = parseFloat(closingAmount) || 0;
    return closing - expectedAmount;
  }, [closingAmount, expectedAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const amount = parseFloat(closingAmount) || 0;
    await onClose({
      sessionId: session.id,
      closingAmount: amount,
      notes: notes || undefined,
    });
  };

  // Determine difference status
  const getDifferenceStatus = () => {
    if (difference > 0) {
      return {
        icon: TrendingUp,
        color: "text-green-600",
        bgColor: "bg-green-50",
        label: "Sobrante",
      };
    } else if (difference < 0) {
      return {
        icon: TrendingDown,
        color: "text-red-600",
        bgColor: "bg-red-50",
        label: "Faltante",
      };
    }
    return {
      icon: Minus,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "Sin diferencia",
    };
  };

  const diffStatus = getDifferenceStatus();
  const DiffIcon = diffStatus.icon;

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-destructive/10 rounded-full">
              <Calculator className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Cierre de Caja</DialogTitle>
              <DialogDescription>
                Revise el resumen de ventas e ingrese el monto de cierre
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monto de apertura</span>
              <span className="font-medium">{formatCurrency(session.openingAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de ventas</span>
              <span className="font-medium text-green-600">+ {formatCurrency(totalSales)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Monto esperado</span>
              <span className="font-bold text-lg">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>

          {/* Editable closing amount */}
          <div className="space-y-2">
            <Label htmlFor="closingAmount">Monto de cierre</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="closingAmount"
                type="number"
                step="0.01"
                min="0"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                className="pl-10 text-lg font-medium"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ingrese el dinero físico contado en la caja
            </p>
          </div>

          {/* Difference display */}
          <div className={`rounded-lg p-4 ${diffStatus.bgColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DiffIcon className={`w-5 h-5 ${diffStatus.color}`} />
                <span className={`font-medium ${diffStatus.color}`}>
                  {diffStatus.label}
                </span>
              </div>
              <span className={`font-bold text-lg ${diffStatus.color}`}>
                {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de cierre (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del cierre de caja..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isClosing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isClosing}
            >
              {isClosing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cerrando caja...
                </>
              ) : (
                "Confirmar Cierre"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
