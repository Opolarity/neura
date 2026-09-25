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

interface DeselectConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeselectConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
}: DeselectConfirmDialogProps) => (
  <AlertDialog
    open={open}
    onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Cambiar el listado</AlertDialogTitle>
        <AlertDialogDescription>
          Las líneas seleccionadas serán deseleccionadas, ¿quieres continuar?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
