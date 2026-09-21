import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Class, Type } from "@/types/index";
import { Warehouse } from "@/types/warehouse";
import { MaterialMovementsFilters } from "../../types/materialMovements.types";

interface MaterialMovementsFilterModalProps {
  isOpen: boolean;
  filters: MaterialMovementsFilters;
  movementTypes: Type[];
  materialClasses: Class[];
  warehouses: Warehouse[];
  stockTypes: Class[];
  onClose: () => void;
  onApply: (filters: MaterialMovementsFilters) => void;
}

/** Centinela: los Select de shadcn no admiten value="". */
const ALL = "all";

const toNumber = (value: string) => (value === ALL ? null : Number(value));
const numValue = (value: number | null | undefined) =>
  value === null || value === undefined ? ALL : String(value);
const boolValue = (value: boolean | null | undefined) =>
  value === null || value === undefined ? ALL : String(value);

const MaterialMovementsFilterModal = ({
  isOpen,
  filters,
  movementTypes,
  materialClasses,
  warehouses,
  stockTypes,
  onClose,
  onApply,
}: MaterialMovementsFilterModalProps) => {
  const [draft, setDraft] = useState<MaterialMovementsFilters>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const clear = () => {
    const cleared: MaterialMovementsFilters = {
      ...draft,
      material_class_id: null,
      warehouse_id: null,
      stock_type_id: null,
      movement_type_id: null,
      start_date: null,
      end_date: null,
      in_out: null,
    };
    setDraft(cleared);
    onApply(cleared);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar movimientos</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-type">Tipo de movimiento</Label>
            <Select
              value={numValue(draft.movement_type_id)}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, movement_type_id: toNumber(v) }))
              }
            >
              <SelectTrigger id="movement-type">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {movementTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="material-class">Clase de material</Label>
            <Select
              value={numValue(draft.material_class_id)}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, material_class_id: toNumber(v) }))
              }
            >
              <SelectTrigger id="material-class">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {materialClasses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="warehouse">Almacén</Label>
            <Select
              value={numValue(draft.warehouse_id)}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, warehouse_id: toNumber(v) }))
              }
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stock-type">Tipo de stock</Label>
            <Select
              value={numValue(draft.stock_type_id)}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, stock_type_id: toNumber(v) }))
              }
            >
              <SelectTrigger id="stock-type">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {stockTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="in-out">Dirección</Label>
            <Select
              value={boolValue(draft.in_out)}
              onValueChange={(v) =>
                setDraft((p) => ({
                  ...p,
                  in_out: v === ALL ? null : v === "true",
                }))
              }
            >
              <SelectTrigger id="in-out">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                <SelectItem value="true">Entradas</SelectItem>
                <SelectItem value="false">Salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Días civiles de Lima: viajan como "YYYY-MM-DD" y el SP los
              resuelve con AT TIME ZONE. No se convierten aquí. */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-date">Desde</Label>
            <Input
              id="start-date"
              type="date"
              value={draft.start_date ?? ""}
              onChange={(e) =>
                setDraft((p) => ({ ...p, start_date: e.target.value || null }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end-date">Hasta</Label>
            <Input
              id="end-date"
              type="date"
              value={draft.end_date ?? ""}
              onChange={(e) =>
                setDraft((p) => ({ ...p, end_date: e.target.value || null }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={clear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(draft)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialMovementsFilterModal;
