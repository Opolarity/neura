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
import { DateRangeFilter, DateRangeValue } from "@/shared/components/date-range";
import { SalesFilters, SaleType, SaleSituation } from "../../types/Sales.types";
import type { SalePaymentStatus } from "../../utils/salePaymentStatus";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SalesFilterModalProps {
  isOpen: boolean;
  filters: SalesFilters;
  saleTypes: SaleType[];
  saleSituations: SaleSituation[];
  onClose: () => void;
  onApply: (filters: Partial<SalesFilters>) => void;
  onClear: () => void;
}

const SalesFilterModal = ({
  isOpen,
  filters,
  saleTypes,
  saleSituations,
  onClose,
  onApply,
  onClear,
}: SalesFilterModalProps) => {
  const [situationId, setSituationId] = useState<number | null>(filters.situationId);
  const [saleType, setSaleType] = useState<number | null>(filters.saleType);
  const [consignament, setConsignament] = useState<boolean | null>(filters.consignament ?? null);
  const [paymentStatus, setPaymentStatus] = useState<SalePaymentStatus | null>(
    filters.paymentStatus ?? null
  );
  const [startDate, setStartDate] = useState<string | null>(
    filters.startDate ?? null
  );
  const [endDate, setEndDate] = useState<string | null>(filters.endDate ?? null);

  useEffect(() => {
    setSituationId(filters.situationId);
    setSaleType(filters.saleType);
    setConsignament(filters.consignament ?? null);
    setPaymentStatus(filters.paymentStatus ?? null);
    setStartDate(filters.startDate ?? null);
    setEndDate(filters.endDate ?? null);
  }, [filters, isOpen]);

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  const handleApply = () => {
    onApply({
      situationId,
      saleType,
      consignament,
      paymentStatus,
      startDate,
      endDate,
    });
  };

  const handleClear = () => {
    setSituationId(null);
    setSaleType(null);
    setConsignament(null);
    setPaymentStatus(null);
    setStartDate(null);
    setEndDate(null);
    onClear();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Filtrar Ventas</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, mismo patrón que el resto de
            modales de filtros: el ScrollArea envuelve solo el cuerpo, así
            cabecera y footer quedan fuera del scroll y Limpiar/Aplicar siempre
            se ven. El max-h va en un contenedor propio y no en el ScrollArea
            (su Root lleva overflow-hidden), y al ser un máximo la altura sigue
            al contenido. Se mantiene el grid gap-4 del cuerpo en vez de pasarlo
            a space-y-4 para no tocar la maquetación; lo que se añade es el
            pl-1 pr-4, que aparta los campos de la barra de scroll. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="grid gap-4 py-4 pl-1 pr-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Situation Filter */}
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select
                    value={situationId?.toString() || "all"}
                    onValueChange={(val) => setSituationId(val === "all" ? null : parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {saleSituations.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status Filter */}
                <div className="grid gap-2">
                  <Label>Estado de pago</Label>
                  <Select
                    value={paymentStatus ?? "all"}
                    onValueChange={(val) =>
                      setPaymentStatus(val === "all" ? null : (val as SalePaymentStatus))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes de pago</SelectItem>
                      <SelectItem value="paid">Pagados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              {/* Consignment Filter */}
              <div className="grid gap-2">
                <Label>Consignación</Label>
                <Select
                  value={consignament === null ? "all" : consignament ? "true" : "false"}
                  onValueChange={(val) =>
                    setConsignament(val === "all" ? null : val === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">A consignación</SelectItem>
                    <SelectItem value="false">No a consignación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
              />
            </div>
          </ScrollArea>
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