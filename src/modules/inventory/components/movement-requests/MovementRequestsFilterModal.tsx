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
import { useEffect, useState } from "react";
import {
  MovementRequestSituationOption,
  MovementRequestFilters,
} from "../../types/MovementRequestList.types";

interface Props {
  situations: MovementRequestSituationOption[];
  filters: MovementRequestFilters;
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: MovementRequestFilters) => void;
}

const MovementRequestsFilterModal = ({
  situations,
  filters,
  isOpen,
  onClose,
  onApply,
}: Props) => {
  const [internalFilters, setInternalFilters] =
    useState<MovementRequestFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleSituationChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      situation_id: value === "none" ? null : Number(value),
    }));
  };

  const handleClear = () => {
    setInternalFilters({ ...filters, situation_id: null });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Solicitudes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Situación</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters.situation_id !== null
                    ? String(internalFilters.situation_id)
                    : "none"
                }
                onValueChange={handleSituationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las situaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las situaciones</SelectItem>
                  {situations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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

export default MovementRequestsFilterModal;
