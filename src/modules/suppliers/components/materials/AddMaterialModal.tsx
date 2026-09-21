import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddMaterial } from "../../hooks/useAddMaterial";
import { Material } from "../../types/materials.types";
import { MaterialOption } from "../../types/services.types";
import { MaterialForm } from "./MaterialForm";

interface AddMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  onSaved?: (created?: MaterialOption) => void;
}

/**
 * Alta RAPIDA de material, sin salir de donde estas.
 *
 * La ficha completa es una pagina (/suppliers/materials/:id): ahi estan el
 * stock por almacen, las imagenes y el historial de precios, que no caben en
 * un dialogo. Este modal se queda para las altas y correcciones EN LINEA --
 * crear un material a mitad de escribir una receta, o desde la orden de
 * produccion -- donde sacarte a otra pantalla te haria perder lo que estabas
 * escribiendo. Es el mismo reparto que hace ExplosionQuickCreateDialog con
 * las recetas.
 *
 * Por eso el formulario va en `compact`: pide lo imprescindible. El historial
 * de precios vivio un tiempo aqui debajo al editar; se fue a la ficha, que es
 * donde se consulta, y el dialogo volvio a su ancho.
 */
export const AddMaterialModal = ({
  open,
  onOpenChange,
  material,
  onSaved,
}: AddMaterialModalProps) => {
  const hook = useAddMaterial({
    material,
    onSuccess: (created) => {
      onSaved?.(created);
      onOpenChange(false);
    },
  });

  const { isEditing, loadingCatalogs, submitting, handleSubmit } = hook;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* w-[calc(100vw-2rem)]: el DialogContent base es `w-full`, así que en
          móvil el diálogo se pegaba a los dos bordes y cualquier contenido que
          no encogiera sacaba barra horizontal.

          2xl y no lg: con 512 px, el árbol de clases --que es lo primero que
          se ve, y con la búsqueda puesta enseña la RUTA entera de cada clase--
          cabía a duras penas y el nombre se comía la fila. */}
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Material" : "Añadir Material"}
          </DialogTitle>
        </DialogHeader>

        {/* El layout lo pone el envoltorio: aqui una columna, en la ficha
            una rejilla de dos. */}
        <div className="space-y-4 py-2">
          <MaterialForm hook={hook} compact />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingCatalogs}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialModal;
