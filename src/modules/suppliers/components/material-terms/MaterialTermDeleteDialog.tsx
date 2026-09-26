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
import { MaterialTermDeleteTarget } from "../../hooks/useMaterialTerms";

interface MaterialTermDeleteDialogProps {
  target: MaterialTermDeleteTarget | null;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

/**
 * Desactivar, no borrar: las variaciones que ya llevan el término lo siguen
 * mostrando; solo deja de ofrecerse para las nuevas.
 */
export const MaterialTermDeleteDialog = ({
  target,
  onCancel,
  onConfirm,
  deleting,
}: MaterialTermDeleteDialogProps) => {
  if (!target) return null;
  const esAtributo = target.kind === "group";
  const enUso = target.item.variationsCount;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Desactivar {esAtributo ? "el atributo" : "el término"}?</DialogTitle>
          <DialogDescription className="pt-4">
            <strong>"{target.item.name}"</strong>{" "}
            {esAtributo ? "y sus términos dejarán" : "dejará"} de ofrecerse para variaciones nuevas.
            {enUso > 0 &&
              ` Las ${enUso} ${enUso === 1 ? "variación que lo lleva lo sigue" : "variaciones que lo llevan lo siguen"} mostrando.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTermDeleteDialog;
