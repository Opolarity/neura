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
import { Material } from "../../types/materials.types";

interface MaterialDeleteDialogProps {
  target: Material | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

/**
 * Eliminar es una baja lógica: el material deja de verse en la lista y en los
 * selectores, pero no se borra. Recetas, órdenes y movimientos que ya lo usan
 * lo siguen mostrando.
 */
export const MaterialDeleteDialog = ({
  target,
  onCancel,
  onConfirm,
  deleting,
}: MaterialDeleteDialogProps) => {
  if (!target) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar el material?</DialogTitle>
          <DialogDescription className="pt-4">
            <strong>"{target.name}"</strong> dejará de verse en la lista de
            materiales y en los selectores. Su stock, sus recetas y su historial
            se conservan.
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

export default MaterialDeleteDialog;
