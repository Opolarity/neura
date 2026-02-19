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
import type { Users } from "../../types/Users.types";

interface UsersDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Users | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const UsersDeleteDialog = ({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: UsersDeleteDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Eliminar usuario?</DialogTitle>
          <DialogDescription className="pt-4">
            Esta acción no se puede deshacer. Se eliminará el usuario{" "}
            <strong>"{user.name}"</strong> de forma permanente.
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
