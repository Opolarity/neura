import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/shared/components/date-range";
import { PAY_TYPE_LABELS, PayType } from "../../types/attendance.types";

export interface PaymentsFilters {
  startDate: string | null;
  endDate: string | null;
  payType: PayType | null;
  /** Solo quienes tienen horas en su bolsa. */
  onlyBank: boolean;
}

interface PaymentsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PaymentsFilters;
  /** Lo que deja «Limpiar» (el rango por defecto: este mes). */
  defaults: PaymentsFilters;
  onApply: (filters: PaymentsFilters) => void;
}

const ALL = "all";

/** «Filtrar pagos», como el modal de filtros de Clientes: rango, tipo de pago y bolsa de horas. */
export const PaymentsFilterModal = ({ isOpen, onClose, filters, defaults, onApply }: PaymentsFilterModalProps) => {
  const [local, setLocal] = useState<PaymentsFilters>(filters);

  useEffect(() => {
    if (isOpen) setLocal(filters);
  }, [isOpen, filters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar pagos</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <DateRangeFilter
                startDate={local.startDate}
                endDate={local.endDate}
                maxRangeDays={92}
                onChange={({ startDate, endDate }) => setLocal((f) => ({ ...f, startDate, endDate }))}
              />
              <div className="space-y-2">
                <Label htmlFor="payments-pay-type">Pago</Label>
                <Select
                  value={local.payType ?? ALL}
                  onValueChange={(v) => setLocal((f) => ({ ...f, payType: v === ALL ? null : (v as PayType) }))}
                >
                  <SelectTrigger id="payments-pay-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {(["HOURLY", "PIECE", "SALARY"] as PayType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {PAY_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payments-bank">Bolsa de horas</Label>
                <Select
                  value={local.onlyBank ? "bank" : ALL}
                  onValueChange={(v) => setLocal((f) => ({ ...f, onlyBank: v === "bank" }))}
                >
                  <SelectTrigger id="payments-bank">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    <SelectItem value="bank">Solo con horas en la bolsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocal(defaults)}>
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
