import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActiveFilter,
  ProcessCatalogFilters,
} from "../../types/processes.types";

// El Select maneja strings; el filtro real es boolean | null.
const ACTIVE = "active";
const INACTIVE = "inactive";
const ALL = "all";

const toOption = (value: ActiveFilter): string =>
  value === null ? ALL : value ? ACTIVE : INACTIVE;

const fromOption = (value: string): ActiveFilter =>
  value === ALL ? null : value === ACTIVE;

interface ProcessCatalogFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProcessCatalogFilters) => void;
  isActive: ActiveFilter;
  title: string;
}

export const ProcessCatalogFilterModal = ({
  isOpen,
  onClose,
  onApply,
  isActive,
  title,
}: ProcessCatalogFilterModalProps) => {
  const [localValue, setLocalValue] = useState<string>(toOption(isActive));

  useEffect(() => {
    setLocalValue(toOption(isActive));
  }, [isActive]);

  const handleApply = () => {
    onApply({ is_active: fromOption(localValue) });
    onClose();
  };

  /** "Limpiar" devuelve al estado por defecto: solo activos. */
  const handleClear = () => setLocalValue(ACTIVE);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: el max-h va en un contenedor propio, no
            en el ScrollArea, que envuelve solo el cuerpo para que cabecera y footer
            queden fuera del scroll. Al ser un máximo la altura se adapta al contenido
            y el scroll solo aparece si hay de sobra, así que sirve el mismo valor en
            todos los modales de filtros. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={localValue} onValueChange={setLocalValue}>
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ACTIVE}>Solo activos</SelectItem>
                    <SelectItem value={INACTIVE}>Solo inactivos</SelectItem>
                    <SelectItem value={ALL}>Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
