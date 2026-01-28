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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import { SalesFilters, SaleType, SaleStatus } from "../../types/Sales.types";

interface SalesFilterModalProps {
  isOpen: boolean;
  filters: SalesFilters;
  saleTypes: SaleType[];
  saleStatuses: SaleStatus[];
  onClose: () => void;
  onApply: (filters: Partial<SalesFilters>) => void;
  onClear: () => void;
}

const SalesFilterModal = ({
  isOpen,
  filters,
  saleTypes,
  saleStatuses,
  onClose,
  onApply,
  onClear,
}: SalesFilterModalProps) => {
  const [status, setStatus] = useState<string | null>(filters.status);
  const [saleType, setSaleType] = useState<number | null>(filters.saleType);
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  useEffect(() => {
    setStatus(filters.status);
    setSaleType(filters.saleType);
    setStartDate(filters.startDate ? new Date(filters.startDate) : undefined);
    setEndDate(filters.endDate ? new Date(filters.endDate) : undefined);
  }, [filters, isOpen]);

  const handleApply = () => {
    onApply({
      status,
      saleType,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
    });
  };

  const handleClear = () => {
    setStatus(null);
    setSaleType(null);
    setStartDate(undefined);
    setEndDate(undefined);
    onClear();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Ventas</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Status Filter */}
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select
              value={status || "all"}
              onValueChange={(val) => setStatus(val === "all" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {saleStatuses.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sale Type Filter */}
          <div className="grid gap-2">
            <Label>Canal de Venta</Label>
            <Select
              value={saleType?.toString() || "all"}
              onValueChange={(val) =>
                setSaleType(val === "all" ? null : parseInt(val))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los canales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                {saleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid gap-2">
            <Label>Fecha Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
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
            <Label>Fecha Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesFilterModal;
