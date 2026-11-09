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
  PRINT_TEMPLATE_AREAS,
  type PrintTemplateArea,
} from "../types/printTemplates.types";

// El Select maneja strings; el filtro real es un área o null (todas).
const ALL = "all";

interface PrintTemplatesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (area: PrintTemplateArea | null) => void;
  area: PrintTemplateArea | null;
}

/** El área de los documentos (Ventas, Guías, Etiquetas, Compras, Producción). */
export const PrintTemplatesFilterModal = ({
  isOpen,
  onClose,
  onApply,
  area,
}: PrintTemplatesFilterModalProps) => {
  const [localArea, setLocalArea] = useState<string>(area ?? ALL);

  useEffect(() => {
    setLocalArea(area ?? ALL);
  }, [area, isOpen]);

  const handleApply = () => {
    onApply(localArea === ALL ? null : (localArea as PrintTemplateArea));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar documentos</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área</Label>
                <Select value={localArea} onValueChange={setLocalArea}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las áreas</SelectItem>
                    {PRINT_TEMPLATE_AREAS.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocalArea(ALL)}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
