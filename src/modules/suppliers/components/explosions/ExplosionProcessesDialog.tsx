import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveProcessCatalogData } from "../../types/processes.types";
import { ExplosionProcess } from "../../types/explosions.types";
import {
  ExplosionProcessesEditor,
  OperationOption,
  ProcessGroupOption,
} from "./ExplosionProcessesEditor";

interface ExplosionProcessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processes: ExplosionProcess[];
  processGroups: ProcessGroupOption[];
  operationCatalog: OperationOption[];
  onAdd: (processGroupId: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, delta: number) => void;
  onAddOperation: (index: number, processId: number) => void;
  onRemoveOperation: (index: number, processId: number) => void;
  onReplaceOperation: (
    index: number,
    processIdViejo: number,
    processIdNuevo: number
  ) => void;
  onClearOperations: (index: number) => void;
  onCreateOperation: (index: number, values: SaveProcessCatalogData) => Promise<boolean>;
  creatingOperation?: boolean;
  readOnly?: boolean;
  /**
   * Pasa la receta a edición sin cerrar el modal.
   *
   * Una receta guardada se abre para LEER, así que sin esto había que cerrar,
   * pulsar el lápiz de la ficha y volver a abrir.
   */
  onEdit?: () => void;
}

/**
 * La ruta del molde, en un modal.
 *
 * Vivía como una Card dentro de la ficha de la receta y pesaba demasiado para
 * una pantalla cuyo asunto son los materiales: al abrir una receta ya no se
 * veía de qué está hecha la prenda, se veía un editor de ruta. Aquí dentro va
 * lo mismo que había allí, sin recortar nada.
 *
 * No tiene "guardar" propio a propósito: edita el estado de la receta, y la
 * receta se guarda con su botón. Cerrar no descarta — lo que descarta es
 * Cancelar en la ficha.
 */
export const ExplosionProcessesDialog = ({
  open,
  onOpenChange,
  readOnly = false,
  onEdit,
  ...editorProps
}: ExplosionProcessesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vincular procesos</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Por dónde pasa el molde. Para cambiarlo, edita la receta."
              : "Se guarda al guardar la receta: aquí no hay que confirmar nada."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <ExplosionProcessesEditor {...editorProps} readOnly={readOnly} />
        </div>

        <DialogFooter>
          {readOnly && onEdit && (
            <Button type="button" onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
