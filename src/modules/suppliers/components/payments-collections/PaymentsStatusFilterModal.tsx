import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** El valor que usa el Select para "sin filtrar": Radix no admite "". */
const TODOS = "all";

export type PaymentsStatus = "OPEN" | "PAID" | null;

interface PaymentsStatusFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  status: PaymentsStatus;
  onApply: (status: PaymentsStatus) => void;
  openLabel: string;
  paidLabel: string;
  /** Campos propios de la pestaña (Operarios: el operario), encima del estado. */
  children?: ReactNode;
  /** «Limpiar» de los campos propios. */
  onClear?: () => void;
}

/**
 * El modal «Filtrar» de Pagos y cobros (neura-styles, como el resto del ERP):
 * el estado (con saldo / saldados / todos) y lo que cada pestaña agregue.
 */
export const PaymentsStatusFilterModal = ({
  isOpen,
  onClose,
  title,
  status,
  onApply,
  openLabel,
  paidLabel,
  children,
  onClear,
}: PaymentsStatusFilterModalProps) => {
  const [local, setLocal] = useState<PaymentsStatus>(status);

  useEffect(() => {
    setLocal(status);
  }, [status, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              {children}
              <div className="space-y-2">
                <Label htmlFor="payments-status">Estado</Label>
                <Select
                  value={local ?? TODOS}
                  onValueChange={(value) => setLocal(value === TODOS ? null : (value as PaymentsStatus))}
                >
                  <SelectTrigger id="payments-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">{openLabel}</SelectItem>
                    <SelectItem value="PAID">{paidLabel}</SelectItem>
                    <SelectItem value={TODOS}>Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLocal(null);
                onClear?.();
              }}
            >
              Limpiar
            </Button>
            <Button
              onClick={() => {
                onApply(local);
                onClose();
              }}
            >
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
