import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmation {
  id: number;
  type: "group" | "term";
  name: string;
}

interface AttributeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteConfirmation: DeleteConfirmation | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const AttributeDeleteDialog = ({
  open,
  onOpenChange,
  deleteConfirmation,
  onConfirm,
  isDeleting,
}: AttributeDeleteDialogProps) => {
  if (!deleteConfirmation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Eliminar {deleteConfirmation.type === "group" ? "atributo" : "término"}?</DialogTitle>
          <DialogDescription className="pt-4">
            {deleteConfirmation.type === "group" ? (
              <>
                Se eliminará el atributo{" "}
                <strong>"{deleteConfirmation.name}"</strong> y todos sus términos
                asociados. Esta acción no se puede deshacer.
              </>
            ) : (
              <>
                Se eliminará el término{" "}
                <strong>"{deleteConfirmation.name}"</strong>. Esta acción no se
                puede deshacer.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
