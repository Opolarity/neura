import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateField } from "@/shared/components/date-range";
import type { POSSessionUser } from "../types/POSList.types";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ModalFilters {
  user_id: string;
  opened_date: string;
  closed_date: string;
}

interface POSListFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: POSSessionUser[];
  appliedFilters: ModalFilters;
  onApply: (filters: ModalFilters) => void;
  onReset: () => void;
}

const EMPTY_FILTERS: ModalFilters = {
  user_id: "",
  opened_date: "",
  closed_date: "",
};

export default function POSListFilterModal({
  open,
  onOpenChange,
  users,
  appliedFilters,
  onApply,
  onReset,
}: POSListFilterModalProps) {
  const [draft, setDraft] = useState<ModalFilters>(appliedFilters);

  useEffect(() => {
    if (open) setDraft(appliedFilters);
  }, [open]);

  const handleChange = (key: keyof ModalFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtrar en Punto de Venta</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, mismo patrón que el resto de
            modales de filtros: el ScrollArea envuelve solo el cuerpo, así
            cabecera y footer quedan fuera del scroll y Limpiar/Aplicar siempre
            se ven. El max-h va en un contenedor propio y no en el ScrollArea
            (su Root lleva overflow-hidden), y al ser un máximo la altura sigue
            al contenido. Se conserva el py-2 del cuerpo en vez del py-4 del
            patrón para no cambiar el espaciado actual; lo que se añade es el
            pl-1 pr-4, que aparta los campos de la barra de scroll. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Usuario</label>
                <Select
                  value={draft.user_id}
                  onValueChange={(value) => handleChange("user_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.userId} value={u.userId}>
                        {u.userName} {u.userLastName ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha de apertura</label>
                <DateField
                  value={draft.opened_date || null}
                  onChange={(value) => handleChange("opened_date", value ?? "")}
                  showClear
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha de cierre</label>
                <DateField
                  value={draft.closed_date || null}
                  onChange={(value) => handleChange("closed_date", value ?? "")}
                  showClear
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
