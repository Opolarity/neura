import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangeFilter, DateRangeValue } from "@/shared/components/date-range";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MovementFilters,
  MovementType,
  MovementCategory,
  PaymentMethod,
  BusinessAccount,
} from "../../types/Movements.types";
import { MultiSelect } from "./MultiSelect";

interface MovementsFilterModalProps {
  isOpen: boolean;
  filters: MovementFilters;
  salesChannels: {label: string, value: string}[],
  movementTypes: MovementType[];
  categories: MovementCategory[];
  paymentMethods: PaymentMethod[];
  businessAccounts: BusinessAccount[];
  onClose: () => void;
  onApply: (filters: MovementFilters) => void;
}

const MovementsFilterModal = ({
  isOpen,
  filters,
  salesChannels,
  movementTypes,
  categories,
  paymentMethods,
  businessAccounts,
  onClose,
  onApply,
}: MovementsFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<MovementFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleSelectChange = (field: keyof MovementFilters, value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      [field]: value === "none" ? null : Number(value),
    }));
  };

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
    setInternalFilters((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: filters.search,
      type: null,
      class: null,
      bussines_account: null,
      payment_method: null,
      start_date: null,
      end_date: null,
      branches: null,
      order: null,
      sale_type: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Filtrar Movimientos</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: los filtros crecen (canales,
            categorías, métodos de pago, cuentas) y sin esto el modal se
            estiraba hasta dejar el footer fuera de la pantalla. El max-h va
            en un contenedor propio, no en el ScrollArea ni en el
            DialogContent. El pr-4 aparta el contenido de la barra de scroll,
            que si no roza el borde derecho de inputs y selects. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">

              <div className="space-y-2">
                <Label className="text-sm font-medium">Canales de Venta</Label>
                <MultiSelect
                  options={salesChannels ?? []}
                  value={internalFilters.sale_type?.map(String) ?? []}
                  onChange={(vals) => setInternalFilters((prev) => ({ ...prev, sale_type: vals.map(Number) }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Movimiento</Label>
                <Select
                  value={
                    internalFilters.type ? String(internalFilters.type) : "none"
                  }
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos los tipos</SelectItem>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select
                  value={
                    internalFilters.class ? String(internalFilters.class) : "none"
                  }
                  onValueChange={(value) => handleSelectChange("class", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas las categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Metodo de Pago</Label>
                <Select
                  value={
                    internalFilters.payment_method
                      ? String(internalFilters.payment_method)
                      : "none"
                  }
                  onValueChange={(value) =>
                    handleSelectChange("payment_method", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los metodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos los metodos</SelectItem>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={String(pm.id)}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cuenta de Negocio</Label>
                <Select
                  value={
                    internalFilters.bussines_account
                      ? String(internalFilters.bussines_account)
                      : "none"
                  }
                  onValueChange={(value) =>
                    handleSelectChange("bussines_account", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas las cuentas</SelectItem>
                    {businessAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={String(ba.id)}>
                        {ba.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Rango de Fechas</Label>
                <DateRangeFilter
                  startDate={internalFilters.start_date ?? null}
                  endDate={internalFilters.end_date ?? null}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(internalFilters)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MovementsFilterModal;
