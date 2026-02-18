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
import type { BranchView } from "../../types/Branches.types";

interface BranchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchView | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const BranchDeleteDialog = ({
  open,
  onOpenChange,
  branch,
  onConfirm,
  isDeleting,
}: BranchDeleteDialogProps) => {
  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Eliminar sucursal?</DialogTitle>
          <DialogDescription className="pt-4">
            Esta acción no se puede deshacer. Se eliminará la sucursal{" "}
            <strong>"{branch.name}"</strong> de forma permanente.
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
