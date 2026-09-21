import { Check, Loader2, Minus, Workflow } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductionOrderProcesses } from "../../hooks/useProductionOrderProcesses";

interface ItemInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number | null;
}

/**
 * Avance de cada prenda por la ruta, en solo lectura.
 *
 * Antes esto era una matriz de checks donde se marcaba a mano por qué pasos
 * pasaba cada ítem. Marcar el avance no tiene sentido: se sabe. Un proceso está
 * culminado para una prenda cuando lo están todos sus servicios -- "Corte" no
 * cierra hasta que llegan la tela y el corte -- y eso lo calcula el backend
 * desde la situación de cada servicio, o desde `finished_at` si la etapa es
 * interna.
 *
 * Qué prenda pasa por qué proceso se sigue configurando en el diálogo de
 * Procesos, asignando el ítem a cada paso. Aquí solo se mira el resultado.
 */
export const ItemInfoDialog = ({
  open,
  onOpenChange,
  productionOrderId,
}: ItemInfoDialogProps) => {
  const { loading, items, processes } = useProductionOrderProcesses({
    productionOrderId,
    open,
  });

  const empty = processes.length === 0 || items.length === 0;

  /**
   * Estado de un proceso para una prenda concreta.
   *
   * Un paso sin ítem asignado vale para toda la orden, así que cuenta para
   * todas las prendas: si no, una etapa común saldría como "no aplica" en
   * todas y el proceso parecería vacío.
   */
  const cellState = (processIndex: number, itemId: number) => {
    const steps = processes[processIndex].steps.filter(
      (step) =>
        step.productionOrderItemIds.length === 0 ||
        step.productionOrderItemIds.includes(itemId)
    );
    if (steps.length === 0) {
      return { applies: false, done: 0, total: 0, progress: null };
    }
    // Las cantidades las calcula el backend por prenda y proceso; aquí solo se
    // busca la que toca. Ausente = ese proceso no cubre esta prenda.
    const progress = processes[processIndex].itemProgress.find(
      (entry) => entry.productionOrderItemId === itemId
    );
    return {
      applies: true,
      done: steps.filter((step) => step.isDone).length,
      total: steps.length,
      progress: progress ?? null,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avance por ítem</DialogTitle>
          <DialogDescription>
            Por dónde va cada prenda. Un proceso queda culminado cuando lo están
            todos sus servicios: «Corte» no cierra hasta que llegan la tela y el
            corte. Se calcula solo — qué prenda pasa por qué proceso se define en
            el diálogo de Procesos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando avance...
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Workflow className="w-8 h-8 opacity-50" />
            <p className="font-medium">
              {items.length === 0
                ? "Esta orden no tiene ítems"
                : "Esta orden no tiene ruta definida"}
            </p>
            <p className="text-sm max-w-md">
              {items.length === 0
                ? "Añade las prendas a producir en el detalle de la orden."
                : "Define los procesos y sus servicios en la sección «Avance por ítem» de la orden."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Prenda</TableHead>
                  <TableHead className="w-24 text-right">Pedidas</TableHead>
                  {processes.map((process) => (
                    <TableHead
                      key={`${process.order}-${process.processId ?? "sin"}`}
                      className="text-center"
                    >
                      <span className="block">
                        {process.processName ?? "Sin proceso"}
                      </span>
                      <span className="text-muted-foreground block font-mono text-[0.65rem] font-normal">
                        {process.stepsDone}/{process.stepsTotal}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-medium">{item.name}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    {processes.map((process, index) => {
                      const state = cellState(index, item.id);
                      const complete = state.applies && state.done === state.total;
                      return (
                        <TableCell
                          key={`${item.id}-${process.order}-${process.processId ?? "sin"}`}
                          className="text-center"
                        >
                          {!state.applies ? (
                            <Minus
                              className="text-muted-foreground/40 mx-auto h-4 w-4"
                              aria-label="No aplica"
                            />
                          ) : complete ? (
                            <span
                              className="bg-primary text-primary-foreground mx-auto inline-flex h-5 w-5 items-center justify-center rounded-full"
                              aria-label="Culminado"
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span
                              className="text-muted-foreground font-mono text-xs"
                              aria-label={`${state.done} de ${state.total} servicios`}
                            >
                              {state.done}/{state.total}
                            </span>
                          )}
                          {state.applies && state.progress !== null && (
                            /* Buenas, merma y pendientes. Vienen calculados:
                               la celda no suma nada. */
                            <span className="mt-0.5 block text-[0.65rem] tabular-nums">
                              <span className="text-muted-foreground">
                                {state.progress.advanced} ok
                              </span>
                              {state.progress.bad > 0 && (
                                <span className="text-destructive">
                                  {" · "}
                                  {state.progress.bad} merma
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                {" · "}
                                {state.progress.remaining === 0
                                  ? "sin pendientes"
                                  : `quedan ${state.progress.remaining}`}
                              </span>
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
