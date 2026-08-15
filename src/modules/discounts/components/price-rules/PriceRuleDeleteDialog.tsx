import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PriceRule } from "../../types/priceRule.types";

interface PriceRuleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modo individual: la regla a eliminar. */
  rule?: PriceRule | null;
  /** Modo masivo: cuántas reglas se van a eliminar. */
  count?: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const PriceRuleDeleteDialog = ({
  open,
  onOpenChange,
  rule = null,
  count = 0,
  onConfirm,
  isDeleting,
}: PriceRuleDeleteDialogProps) => {
  const isBulk = !rule && count > 0;

  const title = isBulk
    ? `Eliminar ${count} ${count === 1 ? "regla" : "reglas"} de precios`
    : "Eliminar Regla de Precios";

  // Se avisa de las dos cosas irreversibles: la regla desaparece del listado con
  // cualquier filtro (solo se recupera desde la BD) y el código de su cupón se
  // libera, así que deja de ser el mismo código en la base.
  const description = isBulk
    ? `¿Eliminar las ${count} reglas seleccionadas? Esta acción no se puede deshacer desde el ERP: ` +
      "dejarán de aparecer en el listado con cualquier filtro. Sus cupones asociados se desactivarán " +
      "y sus códigos quedarán liberados para volver a usarse en reglas nuevas."
    : `¿Eliminar la regla "${rule?.name}"? Esta acción no se puede deshacer desde el ERP: ` +
      "dejará de aparecer en el listado con cualquier filtro. Su cupón asociado se desactivará " +
      "y su código quedará liberado para volver a usarse en una regla nueva.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className={buttonVariants({ variant: "destructive" })}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
