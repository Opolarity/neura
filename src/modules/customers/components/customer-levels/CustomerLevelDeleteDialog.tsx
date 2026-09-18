import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomerLevelDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelName?: string;
  onConfirm: () => void;
}

export const CustomerLevelDeleteDialog = ({
  open,
  onOpenChange,
  levelName = "Nivel",
  onConfirm,
}: CustomerLevelDeleteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>¿Desactivar nivel?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          El nivel <span className="font-semibold text-foreground">"{levelName}"</span> dejará de aplicarse y de
          mostrarse a los clientes. Podrás reactivarlo luego desde su edición.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
