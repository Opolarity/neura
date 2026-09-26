import { useState } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EntityCombobox, ComboboxOption } from "../EntityCombobox";
import { ProcessCatalogFormDialog } from "../processes/ProcessCatalogFormDialog";
import { ExplosionProcess } from "../../types/explosions.types";
import { SaveProcessCatalogData } from "../../types/processes.types";

/** Una etapa del catálogo. No es un paso de la ruta: no lleva operaciones. */
export interface ProcessGroupOption {
  processGroupId: number;
  processGroupName: string | null;
}

/** Una operación del catálogo, con el proceso al que pertenece. */
export interface OperationOption {
  processId: number;
  processName: string;
  processGroupId: number | null;
}

interface ExplosionProcessesEditorProps {
  /** La ruta, en orden. La posición ES la secuencia. */
  processes: ExplosionProcess[];
  processGroups: ProcessGroupOption[];
  operationCatalog: OperationOption[];
  onAdd: (processGroupId: number) => void;
  onRemove: (index: number) => void;
  /** `delta` -1 sube, +1 baja. */
  onMove: (index: number, delta: number) => void;
  onAddOperation: (index: number, processId: number) => void;
  onRemoveOperation: (index: number, processId: number) => void;
  /** Cambia una operación por otra conservando su sitio. */
  onReplaceOperation: (
    index: number,
    processIdViejo: number,
    processIdNuevo: number
  ) => void;
  /** Deja el proceso sin operaciones: vuelve a ir completo. */
  onClearOperations: (index: number) => void;
  /** Da de alta una operación de ese proceso y la deja puesta. */
  onCreateOperation: (index: number, values: SaveProcessCatalogData) => Promise<boolean>;
  creatingOperation?: boolean;
  readOnly?: boolean;
}

/**
 * Selector de operaciones, con su propio texto de búsqueda.
 *
 * Con uno compartido, teclear en un proceso filtraba los de los demás.
 */
const OperationCombobox = ({
  options,
  catalogSize,
  value,
  valueLabel,
  onSelect,
  readOnly,
  placeholderVacio,
  placeholder,
}: {
  /** Las que QUEDAN por elegir. */
  options: ComboboxOption[];
  /** Cuántas hay en el catálogo de ese proceso, elegidas o no. */
  catalogSize: number;
  value?: number | null;
  valueLabel?: string | null;
  onSelect: (option: ComboboxOption) => void;
  readOnly?: boolean;
  placeholderVacio: string;
  placeholder: string;
}) => {
  const [search, setSearch] = useState("");

  // Dos motivos distintos para no poder elegir, y decirlos como uno era
  // mentir: "sin operaciones" con todas ya puestas se lee como "este proceso
  // no admite más", cuando admite las que sean.
  const sinCatalogo = catalogSize === 0;
  const todasPuestas = !sinCatalogo && options.length === 0;

  return (
    <EntityCombobox
      className="w-56"
      options={options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase())
      )}
      value={value ?? null}
      fallbackLabel={valueLabel ?? null}
      onSelect={(option) => {
        onSelect(option);
        setSearch("");
      }}
      search={search}
      onSearchChange={setSearch}
      disabled={readOnly || (sinCatalogo && value == null) || (todasPuestas && value == null)}
      placeholder={
        sinCatalogo ? placeholderVacio : todasPuestas ? "Ya están todas puestas" : placeholder
      }
      searchPlaceholder="Buscar operación..."
    />
  );
};

/**
 * La ruta del molde: por qué procesos pasa, en orden, y qué operaciones lleva
 * cada uno.
 *
 * Una tarjeta plegable por proceso. Dentro, el conmutador decide si ese
 * proceso va COMPLETO --un paso y ya-- o se detalla en operaciones, que es la
 * misma regla excluyente del modelo: una fila con la operación en NULL, o una
 * por operación compartiendo la posición del proceso.
 */
export const ExplosionProcessesEditor = ({
  processes,
  processGroups,
  operationCatalog,
  onAdd,
  onRemove,
  onMove,
  onAddOperation,
  onRemoveOperation,
  onReplaceOperation,
  onClearOperations,
  onCreateOperation,
  creatingOperation = false,
  readOnly = false,
}: ExplosionProcessesEditorProps) => {
  const [search, setSearch] = useState("");
  /** Índice del proceso para el que se está dando de alta una operación. */
  const [creandoEn, setCreandoEn] = useState<number | null>(null);
  /** Procesos desplegados, por id. */
  const [abiertos, setAbiertos] = useState<number[]>([]);
  /**
   * Procesos puestos en modo "por operaciones" que todavía no tienen ninguna.
   *
   * Sin esto, el modo se deduciría solo de la lista y al pulsar "Por
   * operaciones" la tarjeta volvería sola a "Proceso completo".
   */
  const [forzadosPorOperacion, setForzadosPorOperacion] = useState<number[]>([]);

  const esPorOperaciones = (paso: ExplosionProcess) =>
    paso.operations.length > 0 || forzadosPorOperacion.includes(paso.processGroupId);

  // Un proceso no se repite en la misma receta, así que los que ya están no se
  // vuelven a ofrecer. El filtrado por texto se hace aquí: el catálogo se trae
  // entero una vez y `EntityCombobox` va con `shouldFilter={false}`.
  const procesosDisponibles: ComboboxOption[] = processGroups
    .filter(
      (grupo) => !processes.some((paso) => paso.processGroupId === grupo.processGroupId)
    )
    .filter((grupo) =>
      (grupo.processGroupName ?? "").toLowerCase().includes(search.trim().toLowerCase())
    )
    .map((grupo) => ({ id: grupo.processGroupId, label: grupo.processGroupName ?? "" }));

  const handleAdd = (option: ComboboxOption) => {
    onAdd(option.id);
    setSearch("");
    // Nace desplegado: se acaba de añadir para configurarlo.
    setAbiertos((prev) => (prev.includes(option.id) ? prev : [...prev, option.id]));
  };

  const toggleAbierto = (processGroupId: number) =>
    setAbiertos((prev) =>
      prev.includes(processGroupId)
        ? prev.filter((id) => id !== processGroupId)
        : [...prev, processGroupId]
    );

  /** Las del catálogo que son de ese proceso, estén elegidas o no. */
  const operacionesDelProceso = (paso: ExplosionProcess) =>
    operationCatalog.filter(
      (operacion) => operacion.processGroupId === paso.processGroupId
    );

  /** Y de esas, las que aún no eligió NINGUNA línea. */
  const operacionesLibres = (paso: ExplosionProcess): ComboboxOption[] =>
    operacionesDelProceso(paso)
      .filter(
        (operacion) => !paso.operations.some((o) => o.processId === operacion.processId)
      )
      .map((operacion) => ({ id: operacion.processId, label: operacion.processName }));

  const cambiarModo = (index: number, paso: ExplosionProcess, modo: string) => {
    if (!modo) return; // El ToggleGroup emite "" al deseleccionar.

    if (modo === "completo") {
      onClearOperations(index);
      setForzadosPorOperacion((prev) =>
        prev.filter((id) => id !== paso.processGroupId)
      );
    } else {
      setForzadosPorOperacion((prev) =>
        prev.includes(paso.processGroupId) ? prev : [...prev, paso.processGroupId]
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {processes.length}{" "}
          {processes.length === 1 ? "proceso" : "procesos"} · orden de arriba hacia
          abajo
        </span>

        {!readOnly && (
          /* `value={null}`: es un "añadir", no un campo con selección. Mismo
             control y mismo criterio que el "Añadir grupo" de la ruta de la
             orden de producción. */
          <EntityCombobox
            className="w-56"
            options={procesosDisponibles}
            value={null}
            onSelect={handleAdd}
            search={search}
            onSearchChange={setSearch}
            placeholder="Añadir proceso"
            searchPlaceholder="Buscar proceso..."
          />
        )}
      </div>

      {processes.length === 0 ? (
        <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
          Esta receta no declara procesos
        </div>
      ) : (
        <div className="space-y-2">
          {processes.map((paso, index) => {
            const abierto = abiertos.includes(paso.processGroupId);
            const porOperaciones = esPorOperaciones(paso);
            const libres = operacionesLibres(paso);
            const delProceso = operacionesDelProceso(paso);

            return (
              <Collapsible
                key={paso.processGroupId}
                open={abierto}
                onOpenChange={() => toggleAbierto(paso.processGroupId)}
                className="rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {paso.processGroupName}
                  </span>

                  {/* Contador, no estado: por eso `secondary` y no `success`. */}
                  <Badge variant={porOperaciones ? "secondary" : "outline"}>
                    {porOperaciones
                      ? `${paso.operations.length} ${
                          paso.operations.length === 1 ? "operación" : "operaciones"
                        }`
                      : "Proceso completo"}
                  </Badge>

                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${abierto ? "Plegar" : "Desplegar"} ${
                        paso.processGroupName ?? "el proceso"
                      }`}
                    >
                      {abierto ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  {!readOnly && (
                    /* El orden vive aquí y no en un asa de arrastre: arrastrar
                       exige una librería que este repo no tiene, y un asa que
                       no arrastra es peor que no ponerla. */
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Acciones de ${paso.processGroupName ?? "el proceso"}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={index === 0}
                          onClick={() => onMove(index, -1)}
                        >
                          Subir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === processes.length - 1}
                          onClick={() => onMove(index, 1)}
                        >
                          Bajar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRemove(index)}>
                          Quitar del recorrido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <CollapsibleContent className="space-y-3 border-t border-border p-3">
                  {!readOnly && (
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={porOperaciones ? "operaciones" : "completo"}
                      onValueChange={(modo) => cambiarModo(index, paso, modo)}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="completo">
                        Proceso completo
                      </ToggleGroupItem>
                      <ToggleGroupItem value="operaciones">
                        Por operaciones
                      </ToggleGroupItem>
                    </ToggleGroup>
                  )}

                  {porOperaciones ? (
                    <div className="space-y-2">
                      <Label>Operaciones</Label>

                      {paso.operations.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Sin operaciones todavía.
                        </p>
                      )}

                      {paso.operations.map((operacion) => (
                        <div
                          key={operacion.processId}
                          className="flex flex-wrap items-center gap-2"
                        >
                          {/* La operación es un selector: elegir mal y tener
                              que quitar y volver a añadir era un paso de más.
                              Se ofrecen las libres, más la suya. */}
                          <OperationCombobox
                            options={[
                              ...libres,
                              {
                                id: operacion.processId,
                                label: operacion.processName ?? "",
                              },
                            ]}
                            catalogSize={delProceso.length}
                            value={operacion.processId}
                            valueLabel={operacion.processName}
                            onSelect={(option) =>
                              onReplaceOperation(index, operacion.processId, option.id)
                            }
                            readOnly={readOnly}
                            placeholderVacio="Sin operaciones en este proceso"
                            placeholder="Operación"
                          />

                          {!readOnly && (
                            /* Quitar una línea del documento que se está
                               editando, no un registro de un listado: mismo
                               botón que el editor de materiales. */
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveOperation(index, operacion.processId)}
                              title="Quitar la operación"
                              aria-label={`Quitar ${operacion.processName ?? "la operación"}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {!readOnly && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <OperationCombobox
                            options={libres}
                            catalogSize={delProceso.length}
                            onSelect={(option) => onAddOperation(index, option.id)}
                            placeholderVacio="Sin operaciones en este proceso"
                            placeholder="Añadir operación"
                          />
                          {/* Crear la operación sin abandonar la receta, como
                              el "Crear grupo" de la ruta de una orden. */}
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setCreandoEn(index)}
                          >
                            <Plus className="w-4 h-4" />
                            Crear operación nueva
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Se dice en vez de dejar el panel vacío. */
                    <p className="text-sm text-muted-foreground">
                      El proceso entero es un paso.
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Se monta al abrir para partir siempre del formulario en blanco. No
          lleva selector de proceso: la operación nace en el de esa fila. */}
      {creandoEn !== null && (
        <ProcessCatalogFormDialog
          open
          onOpenChange={(open) => !open && setCreandoEn(null)}
          saving={creatingOperation}
          onSave={async (values) => {
            const creada = await onCreateOperation(creandoEn, values);
            if (creada) setCreandoEn(null);
          }}
          entityLabel="Operación"
          isFeminine
          namePlaceholder="ej: Tendido"
          codePlaceholder="ej: TEN"
        />
      )}
    </div>
  );
};
