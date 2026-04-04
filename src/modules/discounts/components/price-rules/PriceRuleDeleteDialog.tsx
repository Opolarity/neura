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
import { Loader2 } from "lucide-react";
import type { PriceRule } from "../../types/priceRule.types";

interface PriceRuleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: PriceRule | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const PriceRuleDeleteDialog = ({
  open,
  onOpenChange,
  rule,
  onConfirm,
  isDeleting,
}: PriceRuleDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desactivar Regla de Precios</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas desactivar la regla "{rule?.name}"?
            Esta acción desactivará la regla y sus cupones asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
