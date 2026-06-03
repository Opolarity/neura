import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import type { FranchisePaymentStatus } from "../services/FranchiseProducts.service";

const PAYMENT_STATUS_OPTIONS: Array<{
  value: FranchisePaymentStatus;
  label: string;
}> = [
  { value: "paid", label: "Pagado" },
  { value: "unpaid", label: "Sin pagar" },
  { value: "partial", label: "Pagado parcialmente" },
];

interface FranchiseFilterModalProps {
  isOpen: boolean;
  dateFrom: string | undefined;
  dateTo: string | undefined;
  paymentStatuses: FranchisePaymentStatus[];
  onClose: () => void;
  onApply: (
    dateFrom: string | undefined,
    dateTo: string | undefined,
    paymentStatuses: FranchisePaymentStatus[],
  ) => void;
  onClear: () => void;
}

const FranchiseFilterModal = ({
  isOpen,
  dateFrom,
  dateTo,
  paymentStatuses,
  onClose,
  onApply,
  onClear,
}: FranchiseFilterModalProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    dateFrom ? new Date(dateFrom) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    dateTo ? new Date(dateTo) : undefined,
  );
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] =
    useState<FranchisePaymentStatus[]>(paymentStatuses);

  useEffect(() => {
    setStartDate(dateFrom ? new Date(dateFrom) : undefined);
    setEndDate(dateTo ? new Date(dateTo) : undefined);
    setSelectedPaymentStatuses(paymentStatuses);
  }, [dateFrom, dateTo, paymentStatuses, isOpen]);

  const togglePaymentStatus = (status: FranchisePaymentStatus) => {
    setSelectedPaymentStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const handleApply = () => {
    onApply(
      startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      selectedPaymentStatuses,
    );
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onClear();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Filtrar</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Fecha desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate
                    ? format(startDate, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Fecha hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate
                    ? format(endDate, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Estado de pago</Label>
            <div className="rounded-md border p-3">
              <div className="grid gap-3">
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedPaymentStatuses.includes(option.value)}
                      onCheckedChange={() => togglePaymentStatus(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FranchiseFilterModal;
