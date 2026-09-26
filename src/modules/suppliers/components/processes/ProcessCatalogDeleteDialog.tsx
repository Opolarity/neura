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
import { ProcessCatalogItem } from "../../types/processes.types";

interface ProcessCatalogDeleteDialogProps {
  /** Si es null el diálogo no se monta. */
  item: ProcessCatalogItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** "proceso" / "operación". */
  entityLabel: string;
  /** Concordancia: "La operación ... la conservan". */
  isFeminine?: boolean;
}

export const ProcessCatalogDeleteDialog = ({
  item,
  isDeleting,
  onCancel,
  onConfirm,
  entityLabel,
  isFeminine = false,
}: ProcessCatalogDeleteDialogProps) => {
  if (!item) return null;

  // Concordancia: "El proceso ... lo usan" / "La operación ... la usan".
  const el = isFeminine ? "La" : "El";
  const lo = isFeminine ? "la" : "lo";

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¿Desactivar {entityLabel}?</DialogTitle>
          <DialogDescription>
            {el} {entityLabel} <strong>"{item.name}"</strong> dejará de aparecer
            en los listados, pero <strong>no se elimina</strong>: las órdenes de
            producción que ya {lo} usan {lo} conservan.
            {item.usageCount > 0 && (
              <>
                {" "}
                Ahora mismo está en uso en{" "}
                <strong>
                  {item.usageCount}{" "}
                  {item.usageCount === 1 ? "registro" : "registros"}
                </strong>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
