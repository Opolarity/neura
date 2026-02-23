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
import { useEffect, useState } from "react";

export interface POSSessionsFilterValues {
  dateFrom: string;
  dateTo: string;
  differenceType: string;
  salesMin: string;
  salesMax: string;
}

interface POSSessionsFilterModalProps {
  filters: POSSessionsFilterValues;
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: POSSessionsFilterValues) => void;
}

const POSSessionsFilterModal = ({
  filters,
  isOpen,
  onClose,
  onApply,
}: POSSessionsFilterModalProps) => {
  const [internal, setInternal] = useState<POSSessionsFilterValues>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternal(filters);
    }
  }, [isOpen, filters]);

  const handleClear = () => {
    setInternal({
      dateFrom: "",
      dateTo: "",
      differenceType: "",
      salesMin: "",
      salesMax: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Sesiones</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rango de Fecha</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={internal.dateFrom}
                onChange={(e) =>
                  setInternal((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                placeholder="Desde"
              />
              <Input
                type="date"
                value={internal.dateTo}
                onChange={(e) =>
                  setInternal((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* Difference Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Diferencia</Label>
            <Select
              value={internal.differenceType || "all"}
              onValueChange={(v) =>
                setInternal((prev) => ({
                  ...prev,
                  differenceType: v === "all" ? "" : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="none">Sin diferencia</SelectItem>
                <SelectItem value="opening">Diferencia en apertura</SelectItem>
                <SelectItem value="closing">Diferencia en cierre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sales Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Total de ventas</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={internal.salesMin}
                onChange={(e) =>
                  setInternal((prev) => ({ ...prev, salesMin: e.target.value }))
                }
                placeholder="Mínimo"
                min="0"
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
              />
              <Input
                type="number"
                value={internal.salesMax}
                onChange={(e) =>
                  setInternal((prev) => ({ ...prev, salesMax: e.target.value }))
                }
                placeholder="Máximo"
                min="0"
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(internal)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default POSSessionsFilterModal;
