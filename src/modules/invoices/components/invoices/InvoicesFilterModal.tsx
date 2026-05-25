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
import { ActiveInvoiceFilters } from "@/modules/invoices/hooks/useInvoices";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ListFilter } from "lucide-react";
import { useEffect, useState } from "react";

interface InvoicesFilterModalProps {
  activeFilters?: ActiveInvoiceFilters | null;
  onApply?: (filters: ActiveInvoiceFilters) => void;
  onClear?: () => void;
}

interface ModalFilters {
  declared: string;
  type: string;
  min_mount: string;
  max_mount: string;
  start_date: string;
  end_date: string;
}

const defaultModalFilters: ModalFilters = {
  declared: "all",
  type: "",
  min_mount: "",
  max_mount: "",
  start_date: "",
  end_date: "",
};

const toModalFilters = (filters: ActiveInvoiceFilters): ModalFilters => ({
  declared:
    filters.declared === true ? "true" : filters.declared === false ? "false" : "all",
  type: filters.type != null ? String(filters.type) : "",
  min_mount: filters.min_mount != null ? String(filters.min_mount) : "",
  max_mount: filters.max_mount != null ? String(filters.max_mount) : "",
  start_date: filters.start_date ?? "",
  end_date: filters.end_date ?? "",
});

const toActiveFilters = (modal: ModalFilters): ActiveInvoiceFilters => ({
  declared: modal.declared === "all" ? null : modal.declared === "true",
  type: modal.type !== "" ? Number(modal.type) : null,
  min_mount: modal.min_mount !== "" ? Number(modal.min_mount) : null,
  max_mount: modal.max_mount !== "" ? Number(modal.max_mount) : null,
  start_date: modal.start_date || null,
  end_date: modal.end_date || null,
});

const InvoicesFilterModal = ({ activeFilters, onApply, onClear }: InvoicesFilterModalProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ModalFilters>(defaultModalFilters);

  useEffect(() => {
    if (!open) return;
    setLocalFilters(toModalFilters(activeFilters ?? {}));
  }, [open]);

  const handleChange = (field: keyof ModalFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply?.(toActiveFilters(localFilters));
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultModalFilters);
    onClear?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"default"} className="gap-2">
          <ListFilter className="w-4 h-4" />
          Filtrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Facturas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="declared">Declarado</Label>
            <Select
              value={localFilters.declared}
              onValueChange={(v) => handleChange("declared", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Declarado</SelectItem>
                <SelectItem value="false">No declarado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de factura</Label>
            <Input
              id="type"
              type="number"
              placeholder="ID del tipo"
              value={localFilters.type}
              onChange={(e) => handleChange("type", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min_mount">Monto mínimo</Label>
              <Input
                id="min_mount"
                type="number"
                placeholder="0.00"
                value={localFilters.min_mount}
                onChange={(e) => handleChange("min_mount", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_mount">Monto máximo</Label>
              <Input
                id="max_mount"
                type="number"
                placeholder="9999.99"
                value={localFilters.max_mount}
                onChange={(e) => handleChange("max_mount", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Fecha inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={localFilters.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">Fecha fin</Label>
              <Input
                id="end_date"
                type="date"
                value={localFilters.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicesFilterModal;
