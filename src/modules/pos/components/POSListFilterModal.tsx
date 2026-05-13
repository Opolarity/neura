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
import { Input } from "@/components/ui/input";
import type { POSSessionUser } from "../types/POSList.types";

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
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtrar en Punto de Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
            <Input
              type="date"
              value={draft.opened_date}
              onChange={(e) => handleChange("opened_date", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de cierre</label>
            <Input
              type="date"
              value={draft.closed_date}
              onChange={(e) => handleChange("closed_date", e.target.value)}
            />
          </div>
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
