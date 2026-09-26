import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialClass } from "../../types/materials.types";

interface MaterialClassDeleteDialogProps {
  target: MaterialClass | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

/**
 * Eliminar es una baja lógica: la clase deja de ofrecerse, pero no se borra.
 * Si aún tiene materiales o clases dentro, la base lo rechaza y el toast dice
 * qué mover primero.
 */
export const MaterialClassDeleteDialog = ({
  target,
  onCancel,
  onConfirm,
  deleting,
}: MaterialClassDeleteDialogProps) => {
  if (!target) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar la clase?</DialogTitle>
          <DialogDescription className="pt-4">
            <strong>"{target.name}"</strong> dejará de ofrecerse al crear o
            editar materiales. Solo se puede eliminar si ya no tiene materiales
            ni clases dentro.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialClassDeleteDialog;
