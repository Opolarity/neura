import { useState, useEffect } from "react";
import { formatDateDisplay, toDateInputValue } from "@/shared/utils/date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { MultiSelect } from "@/modules/movements/components/movements/MultiSelect";
import {
  CategorySelector,
  type CategoryOption,
} from "@/shared/components/category-selector";
import type {
  FranchiseeOption,
  FranchisePaymentStatus,
  FranchiseSalesStatus,
  FranchiseStockStatus,
} from "../services/FranchiseProducts.service";

/**
 * Lo que el modal edita. Las categorías viajan como objetos y no como ids para
 * conservar el nombre entre aperturas y poder rotularlas en el Excel.
 */
export interface FranchiseFilterValues {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  paymentStatuses: FranchisePaymentStatus[];
  salesStatus: FranchiseSalesStatus;
  accountIds: number[];
  stockStatus: FranchiseStockStatus;
  orderId: number | undefined;
  categories: CategoryOption[];
}

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

const STOCK_STATUS_OPTIONS: Array<{
  value: FranchiseStockStatus;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Con stock en tienda" },
  { value: "settled", label: "Vendido completo" },
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

const getCategoriesLabel = (categories: CategoryOption[]): string => {
  if (categories.length === 0) return "Todas las categorías";
  if (categories.length === 1) return categories[0].name;
  return `${categories.length} categorías`;
};

const parseDateFilter = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
};

interface FranchiseFilterModalProps {
  isOpen: boolean;
  values: FranchiseFilterValues;
  /** Franquiciados con consignaciones; los trae el propio listado. */
  franchisees: FranchiseeOption[];
  onClose: () => void;
  onApply: (values: FranchiseFilterValues) => void;
  onClear: () => void;
}

const FranchiseFilterModal = ({
  isOpen,
  values,
  franchisees,
  onClose,
  onApply,
  onClear,
}: FranchiseFilterModalProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    parseDateFilter(values.dateFrom),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    parseDateFilter(values.dateTo),
  );
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] =
    useState<FranchisePaymentStatus[]>(values.paymentStatuses);
  const [selectedSalesStatus, setSelectedSalesStatus] =
    useState<FranchiseSalesStatus>(values.salesStatus);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>(
    values.accountIds,
  );
  const [selectedStockStatus, setSelectedStockStatus] =
    useState<FranchiseStockStatus>(values.stockStatus);
  const [orderIdInput, setOrderIdInput] = useState<string>(
    values.orderId ? String(values.orderId) : "",
  );
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    values.categories,
  );

  // Se sincroniza al abrir; mientras el modal está abierto la edición es local
  // y no debe pisarse porque el padre vuelva a renderizar.
  useEffect(() => {
    setStartDate(parseDateFilter(values.dateFrom));
    setEndDate(parseDateFilter(values.dateTo));
    setSelectedPaymentStatuses(values.paymentStatuses);
    setSelectedSalesStatus(values.salesStatus);
    setSelectedAccountIds(values.accountIds);
    setSelectedStockStatus(values.stockStatus);
    setOrderIdInput(values.orderId ? String(values.orderId) : "");
    setSelectedCategories(values.categories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const togglePaymentStatus = (status: FranchisePaymentStatus) => {
    setSelectedPaymentStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const handleApply = () => {
    const parsedOrderId = parseInt(orderIdInput);

    onApply({
      // startDate/endDate son Date de CALENDARIO (los da <Calendar>), no
      // instantes: se serializan por componentes locales con
      // toDateInputValue, el mismo helper que usa el resto de la app.
      dateFrom: startDate ? toDateInputValue(startDate) : undefined,
      dateTo: endDate ? toDateInputValue(endDate) : undefined,
      paymentStatuses: selectedPaymentStatuses,
      salesStatus: selectedSalesStatus,
      accountIds: selectedAccountIds,
      stockStatus: selectedStockStatus,
      orderId:
        Number.isInteger(parsedOrderId) && parsedOrderId > 0
          ? parsedOrderId
          : undefined,
      categories: selectedCategories,
    });
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAccountIds([]);
    setSelectedStockStatus("all");
    setOrderIdInput("");
    setSelectedCategories([]);
    onClear();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Filtrar</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, igual que ProductsFilterModal: el
            max-h va en un contenedor propio, no en el ScrollArea. Al ser un
            máximo la altura se adapta al contenido y el scroll solo aparece si
            hay de sobra, así que sirve el mismo valor en todos los modales. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="grid gap-4 py-4 pl-1 pr-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Franquiciado</Label>
                <MultiSelect
                  options={franchisees.map((franchisee) => ({
                    label: franchisee.name,
                    value: String(franchisee.id),
                  }))}
                  value={selectedAccountIds.map(String)}
                  onChange={(selected) =>
                    setSelectedAccountIds(selected.map(Number))
                  }
                  placeholder="Todos los franquiciados"
                  showSearch
                  showClear
                />
              </div>

              <div className="grid gap-2">
                <Label>Fecha de venta desde</Label>
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
                        ? formatDateDisplay(toDateInputValue(startDate))
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
                <Label>Fecha de venta hasta</Label>
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
                        ? formatDateDisplay(toDateInputValue(endDate))
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
                        // w-full + min-w-0 son lo que deja que el span trunque: sin
                        // ellos el texto no encoge y el boton se sale de su columna.
                        "w-full min-w-0 justify-between text-left font-normal",
                        selectedPaymentStatuses.length === 0 &&
                          "text-muted-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
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

              <div className="grid gap-2">
                <Label>Stock en tienda</Label>
                <Select
                  value={selectedStockStatus}
                  onValueChange={(value) =>
                    setSelectedStockStatus(value as FranchiseStockStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="franchise-order-id">N° de orden</Label>
                <Input
                  id="franchise-order-id"
                  type="number"
                  min={1}
                  placeholder="Todas"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label>Categoría</Label>
                <CategorySelector
                  selectedItems={selectedCategories}
                  onChangeItems={setSelectedCategories}
                  trigger={
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between text-left font-normal",
                        selectedCategories.length === 0 && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">
                        {getCategoriesLabel(selectedCategories)}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  }
                />
              </div>
            </div>
          </ScrollArea>
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
