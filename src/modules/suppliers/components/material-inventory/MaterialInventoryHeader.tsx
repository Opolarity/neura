import { Loader2, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaterialInventoryHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * El título y, a su derecha, el modo edición.
 *
 * Mismo reparto que el inventario de productos: se entra a editar, se teclea
 * sobre la rejilla y se guarda. Guardar solo se ofrece cuando hay algo que
 * guardar -- un botón activo que no haría nada invita a pulsarlo.
 */
const MaterialInventoryHeader = ({
  isEditing,
  isSaving,
  hasChanges,
  onEdit,
  onCancel,
  onSave,
}: MaterialInventoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">
        Lista de inventario
      </h1>

      <div className="flex flex-wrap justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={!hasChanges || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </>
        ) : (
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <SquarePen className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
};

export default MaterialInventoryHeader;
