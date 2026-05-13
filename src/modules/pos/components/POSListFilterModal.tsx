import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface POSListFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function POSListFilterModal({
  open,
  onOpenChange,
}: POSListFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtrar en Punto de Venta</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
