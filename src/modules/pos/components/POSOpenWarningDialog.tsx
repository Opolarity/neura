import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface POSOpenWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToPOS: () => void;
}

export function POSOpenWarningDialog({ open, onOpenChange, onGoToPOS }: POSOpenWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>Punto de venta abierto</DialogTitle>
          </div>
          <DialogDescription>
            Tienes una sesión de punto de venta activa. Te recomendamos cerrarla antes de salir para evitar inconsistencias en los registros.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onGoToPOS}>
            Ir a Punto de Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
