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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import type {
  FranchisePaymentStatus,
  FranchiseSalesStatus,
} from "../services/FranchiseProducts.service";

const PAYMENT_STATUS_OPTIONS: Array<{
  value: FranchisePaymentStatus;
  label: string;
}> = [
  { value: "paid", label: "Pagado" },
  { value: "unpaid", label: "Sin pagar" },
  { value: "partial", label: "Pagado parcialmente" },
];

const SALES_STATUS_OPTIONS: Array<{
  value: FranchiseSalesStatus;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "with_sales", label: "Con ventas" },
  { value: "without_sales", label: "Sin ventas" },
];

const getPaymentStatusesLabel = (
  statuses: FranchisePaymentStatus[],
): string => {
  if (statuses.length === 0) return "Seleccionar estados";
  if (statuses.length === PAYMENT_STATUS_OPTIONS.length) return "Todos";

  return PAYMENT_STATUS_OPTIONS.filter((option) =>
    statuses.includes(option.value),
  )
    .map((option) => option.label)
    .join(", ");
};

const parseDateFilter = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
};

interface FranchiseFilterModalProps {
  isOpen: boolean;
  dateFrom: string | undefined;
  dateTo: string | undefined;
  paymentStatuses: FranchisePaymentStatus[];
  salesStatus: FranchiseSalesStatus;
  onClose: () => void;
  onApply: (
    dateFrom: string | undefined,
    dateTo: string | undefined,
    paymentStatuses: FranchisePaymentStatus[],
    salesStatus: FranchiseSalesStatus,
  ) => void;
  onClear: () => void;
}

const FranchiseFilterModal = ({
  isOpen,
  dateFrom,
  dateTo,
  paymentStatuses,
  salesStatus,
  onClose,
  onApply,
  onClear,
}: FranchiseFilterModalProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    parseDateFilter(dateFrom),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseDateFilter(dateTo),
  );
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] =
    useState<FranchisePaymentStatus[]>(paymentStatuses);
  const [selectedSalesStatus, setSelectedSalesStatus] =
    useState<FranchiseSalesStatus>(salesStatus);

  useEffect(() => {
    setStartDate(parseDateFilter(dateFrom));
    setEndDate(parseDateFilter(dateTo));
    setSelectedPaymentStatuses(paymentStatuses);
    setSelectedSalesStatus(salesStatus);
  }, [dateFrom, dateTo, paymentStatuses, salesStatus, isOpen]);

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
      selectedSalesStatus,
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-between text-left font-normal",
                    selectedPaymentStatuses.length === 0 &&
                      "text-muted-foreground",
                  )}
                >
                  <span className="truncate">
                    {getPaymentStatusesLabel(selectedPaymentStatuses)}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-1">
                {PAYMENT_STATUS_OPTIONS.map((option) => {
                  const checked = selectedPaymentStatuses.includes(
                    option.value,
                  );

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => togglePaymentStatus(option.value)}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        {checked && <Check className="h-4 w-4" />}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Estado de venta</Label>
            <Select
              value={selectedSalesStatus}
              onValueChange={(value) =>
                setSelectedSalesStatus(value as FranchiseSalesStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
