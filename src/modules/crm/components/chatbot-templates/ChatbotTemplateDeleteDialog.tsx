import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";

interface ChatbotTemplateDeleteDialogProps {
  /** La plantilla a eliminar; null si no hay ninguna. */
  template: ChatbotTemplate | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Confirmación para eliminar una plantilla. T-922: cualquiera que no esté bloqueada. */
export default function ChatbotTemplateDeleteDialog({
  template,
  deleting,
  onOpenChange,
  onConfirm,
}: ChatbotTemplateDeleteDialogProps) {
  return (
    <AlertDialog open={!!template} onOpenChange={(open) => !deleting && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Eliminar la plantilla <span className="font-mono">{template?.name}</span>? El bot deja de usarla en menos de
            un minuto y no se puede recuperar desde el ERP. Sus etiquetas siguen disponibles para otras plantillas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Se cierra recién cuando el borrado termina (lo decide la página).
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
            className={buttonVariants({ variant: "destructive" })}
          >
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {deleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
