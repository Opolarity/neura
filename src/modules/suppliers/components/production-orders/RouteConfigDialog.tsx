import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  FileText,
  Link2,
  Loader2,
  Plus,
  Unlink,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/shared/hooks/use-toast";
import { EntityCombobox, ComboboxOption } from "../EntityCombobox";
import { ProcessCatalogFormDialog } from "../processes/ProcessCatalogFormDialog";
import { QuotationFromProcessDialog } from "./QuotationFromProcessDialog";
import { useProductionOrderProcesses } from "../../hooks/useProductionOrderProcesses";
import { DateField } from "@/shared/components/date-range";
import { createProcessGroupApi } from "../../services/processes.service";
import { SaveProcessCatalogData } from "../../types/processes.types";
import { ServiceProcesses } from "../../types/productionOrderProcesses.types";

interface RouteConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number | null;
  /** OP-0028. Va al nombre de la cotización que nace de un proceso. */
  productionOrderCode?: string | null;
  /** Se ejecuta tras guardar, para que la ruta de detrás se relea. */
  onSaved?: () => void;
  /**
   * Abre el diálogo de vincular servicios. El botón vive aquí y no en la
   * cabecera de la pantalla porque los servicios se traen para asignarlos a un
   * proceso: es el primer paso de lo que se hace en esta sección.
   */
  onLinkServices?: () => void;
  /**
   * Quita un servicio de la orden. Vive aquí porque esta tabla es ya la lista
   * de servicios de la orden: al retirarse el panel de servicios vinculados,
   * era el único sitio desde donde se podía desvincular.
   */
  onUnlinkService?: (serviceId: number) => void;
  unlinkingId?: number | null;
}

/**
 * Configurar la ruta: qué procesos tiene la orden y qué servicio cubre cada
 * uno, con las prendas de cada servicio.
 *
 * Vive en un diálogo y no en la pantalla porque es una tarea de montaje, que
 * se hace una vez y se guarda con un botón -- distinta de avanzar por la ruta,
 * que se hace muchas veces y es inmediato. Tenerlas juntas hacía que registrar
 * lo que salió de corte se sintiera como editar configuración.
 *
 * Sólo se muestran los procesos que están en juego: los que ya tienen algún
 * servicio asignado, más los que se añadan a mano. Antes se pintaba una columna
 * por cada proceso del catálogo -- once en demo -- y la mayoría no tenían nada
 * que ver con la orden.
 */
export const RouteConfigDialog = ({
  open,
  onOpenChange,
  productionOrderId,
  productionOrderCode = null,
  onSaved,
  onLinkServices,
  onUnlinkService,
  unlinkingId = null,
}: RouteConfigDialogProps) => {
  const {
    loading,
    saving,
    services,
    processOptions,
    processSearch,
    setProcessSearch,
    groupOptions,
    groupSearch,
    setGroupSearch,
    items,
    updateStep,
    handleSave,
    setServicePromisedDate,
    processes,
    reload,
  } = useProductionOrderProcesses({ productionOrderId, open });

  /** Columnas visibles. Se siembra con lo ya asignado y crece a mano. */
  const [visibleGroups, setVisibleGroups] = useState<ComboboxOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  /** El proceso que se está cotizando, o null. */
  const [quoteFor, setQuoteFor] = useState<{
    processGroupId: number;
    processGroupName: string;
    stepOrder: number;
  } | null>(null);

  /** El total de prendas de la orden: la cantidad que llevará el servicio. */
  const orderQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Los procesos que ya cubren un servicio tienen que estar sí o sí: si no,
  // una asignación viva quedaría invisible.
  //
  // Se siembran EN EL ORDEN DE LA RUTA -- `processes` viene ordenado por su
  // posición -- y no en el orden en que aparecen los servicios, que es de
  // donde salía antes: las columnas son la secuencia, así que sembrarlas por
  // otro criterio la contaba mal desde el primer render.
  useEffect(() => {
    const assigned = processes
      .filter((process) => process.processGroupId !== null)
      .map((process) => ({
        id: process.processGroupId as number,
        label: process.processGroupName ?? `Grupo ${process.processGroupId}`,
      }));

    setVisibleGroups((prev) => {
      const merged = [...prev];
      for (const process of assigned) {
        if (!merged.some((p) => p.id === process.id)) merged.push(process);
      }
      return merged;
    });
    // Lee `processes`, no `services`: los procesos que solo tienen pasos sin
    // servicio salen ahi y en la otra lista no. Las dos se reemplazan juntas
    // en cada carga, asi que la dependencia correcta no cambia cuando se
    // dispara, solo de que depende de verdad.
  }, [processes]);

  /**
   * Mover un proceso en la ruta. `delta` -1 lo adelanta, +1 lo atrasa.
   *
   * El orden de las columnas ES la secuencia de la ruta, así que moverlas es
   * definirla. Se guarda al pulsar «Guardar procesos», como el resto.
   */
  const moveProcess = (processId: number, delta: number) => {
    setVisibleGroups((prev) => {
      const from = prev.findIndex((p) => p.id === processId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  /** Cuántos servicios usan un proceso: decide si se puede quitar la columna. */
  const usage = useMemo(() => {
    const count = new Map<number, number>();
    for (const service of services) {
      const id = service.steps[0]?.processGroupId;
      if (id) count.set(id, (count.get(id) ?? 0) + 1);
    }
    return count;
  }, [services]);

  /** Resumen de la selección para el botón. */
  const itemsLabel = (ids: number[]) => {
    if (ids.length === 0) return "Todos";
    if (ids.length === 1) {
      return items.find((it) => it.id === ids[0])?.name ?? "1 ítem";
    }
    return `${ids.length} ítems`;
  };

  const toggleItem = (serviceId: number, itemId: number) => {
    const service = services.find((s) => s.supplierServiceId === serviceId);
    const current = service?.steps[0]?.productionOrderItemIds ?? [];
    updateStep(serviceId, 0, {
      productionOrderItemIds: current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    });
  };

  const addGroup = (option: ComboboxOption) => {
    setVisibleGroups((prev) =>
      prev.some((p) => p.id === option.id) ? prev : [...prev, option]
    );
    setGroupSearch("");
  };

  /**
   * Guardar la ruta. Cada servicio tiene que decir a qué GRUPO de procesos va
   * (obligatorio); el proceso concreto es opcional. El backend lo valida
   * igualmente, pero avisar aquí evita el viaje y señala el servicio.
   */
  const saveRoute = async () => {
    const sinGrupo = services.find((service) => !service.steps[0]?.processGroupId);
    if (sinGrupo) {
      toast({
        title: `El servicio "${sinGrupo.serviceDescription}" necesita un grupo de procesos.`,
        variant: "destructive",
      });
      return;
    }
    await handleSave(visibleGroups.map((p) => p.id));
    onSaved?.();
    onOpenChange(false);
  };

  const handleCreate = async (values: SaveProcessCatalogData) => {
    try {
      setCreating(true);
      const createdId = await createProcessGroupApi(values);
      // Se añade a la ruta sin salir de la pantalla: crear un grupo aquí es
      // para usarlo aquí.
      //
      // Antes se leia `created.id` de una respuesta que la funcion tiraba a la
      // basura, asi que el grupo entraba en la ruta con id `undefined` y no
      // se podia guardar. Ahora createProcessGroupApi devuelve el id.
      if (createdId !== null) {
        addGroup({ id: createdId, label: values.name });
      }
      setCreateOpen(false);
      toast({ title: "Grupo creado", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Error al crear el grupo: " + error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (productionOrderId === null) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Cabecera y acciones fijas; solo scrollea el cuerpo. Antes scrolleaba
          el diálogo entero y «Guardar procesos» colgaba del pie: cada proceso
          cotizado alargaba la matriz y el botón se iba mas lejos. */}
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="space-y-1.5">
              <DialogTitle>Configurar ruta</DialogTitle>
              <DialogDescription>
                Qué procesos tiene la orden y qué servicio cubre cada uno. Se puede
                colocar un proceso y cotizarlo después: el paso guarda su sitio en
                la ruta aunque todavía no tenga servicio.
              </DialogDescription>
            </div>
            {/* Cerrar y guardar son las dos salidas del diálogo: van juntas y
                arriba, donde se ven sin bajar. */}
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {/* Basta con que haya ruta: un paso puede guardarse sin servicio. */}
              {visibleGroups.length > 0 && (
                <Button
                  onClick={saveRoute}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar procesos"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2 pr-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span />

        <div className="flex flex-wrap items-center gap-2">
          {onLinkServices && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onLinkServices}
            >
              <Link2 className="h-4 w-4" />
              Vincular servicios
            </Button>
          )}
          <EntityCombobox
            className="w-56"
            options={groupOptions}
            value={null}
            onSelect={addGroup}
            search={groupSearch}
            onSearchChange={setGroupSearch}
            placeholder="Añadir grupo"
            searchPlaceholder="Buscar grupo..."
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Crear grupo
          </Button>
        </div>
      </div>

      {/* La ruta, como lista vertical.
          Antes cada proceso era una COLUMNA de la tabla, asi que añadir
          procesos la ensanchaba y a partir de cuatro o cinco se salia de la
          pantalla. Aqui la ruta crece hacia abajo, que es hacia donde hay
          sitio, y de paso se lee como lo que es: una secuencia. */}
      {visibleGroups.length > 0 && (
        <div className="rounded-md border">
          <ul className="divide-y">
            {visibleGroups.map((process, index) => {
              const used = usage.get(process.id) ?? 0;
              return (
                <li
                  key={process.id}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  {/* El numero dice en que punto de la ruta va. */}
                  <span className="text-muted-foreground w-5 text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{process.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {used === 0
                      ? "pendiente de cotizar"
                      : used === 1
                        ? "1 servicio"
                        : `${used} servicios`}
                  </span>
                  {/* Cotizar el proceso sin salir de aquí. Antes esto eran
                      cuatro pantallas: ir a Cotizaciones, crearla, volver,
                      vincular el servicio y asignarle el proceso. Se ve
                      siempre, también con el proceso ya cubierto: un mismo
                      proceso puede ir a dos proveedores. */}
                  {productionOrderId !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs"
                      onClick={() =>
                        setQuoteFor({
                          processGroupId: process.id,
                          processGroupName: process.label,
                          stepOrder: index + 1,
                        })
                      }
                      title={`Crear la cotización de ${process.label} para esta orden`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Cotizar
                    </Button>
                  )}
                  {/* Arriba y abajo, no izquierda y derecha: la ruta ya no se
                      lee en horizontal. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => moveProcess(process.id, -1)}
                    aria-label={`Adelantar ${process.label} en la ruta`}
                    title="Adelantar en la ruta"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === visibleGroups.length - 1}
                    onClick={() => moveProcess(process.id, 1)}
                    aria-label={`Atrasar ${process.label} en la ruta`}
                    title="Atrasar en la ruta"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            // Quitar un proceso con servicios dentro
                            // ocultaria una asignacion viva.
                            disabled={used > 0}
                            onClick={() =>
                              setVisibleGroups((prev) =>
                                prev.filter((p) => p.id !== process.id)
                              )
                            }
                            aria-label={`Quitar ${process.label}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {used > 0 && (
                        <TooltipContent>
                          {used === 1
                            ? "Un servicio está en este proceso"
                            : `${used} servicios están en este proceso`}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando procesos...
        </div>
      ) : services.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center">
          <Workflow className="h-7 w-7 opacity-50" />
          <p className="font-medium">Esta orden todavía no tiene servicios</p>
          {/* Decía «vincula servicios para que aparezcan aquí» y nada más, que
              con la ruta ya puesta arriba se leía como que faltaba algo para
              poder guardar. No falta: la ruta se guarda sola. */}
          <p className="max-w-md text-sm">
            La ruta de arriba se guarda igual. Cada proceso se queda{" "}
            <span className="font-medium">pendiente de cotizar</span> hasta que
            le crees su cotización con «Cotizar», y desde ese momento su
            servicio aparece en esta tabla.
          </p>
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center">
          <Workflow className="h-7 w-7 opacity-50" />
          <p className="max-w-md text-sm">
            Añade los procesos por los que pasa esta orden para poder asignarles
            los servicios.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-52">Servicio</TableHead>
                {/* El grupo de procesos es obligatorio: es lo que define el
                    paso de la orden. El proceso concreto es opcional. */}
                <TableHead className="min-w-52">Grupo *</TableHead>
                <TableHead className="min-w-52">Proceso</TableHead>
                {/* La fecha pactada con el taller, la misma que se pone al
                    cotizar. Se corrige aquí porque es donde se está mirando el
                    calendario entero de la orden. */}
                <TableHead className="min-w-44">Fecha pactada</TableHead>
                <TableHead className="min-w-44">Ítem</TableHead>
                {onUnlinkService && <TableHead className="w-14" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                // Un servicio es una fila de production_order_info, así que su
                // proceso es el del primer paso.
                const step = service.steps[0];
                return (
                  <TableRow key={service.supplierServiceId}>
                    <TableCell>
                      <span className="font-medium">
                        {service.serviceDescription}
                      </span>
                      {service.serviceCode && (
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          {service.serviceCode}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {/* El grupo de procesos al que va el servicio. Es el eje
                          del paso en producción externa: obligatorio. */}
                      <Select
                        value={
                          step?.processGroupId
                            ? String(step.processGroupId)
                            : undefined
                        }
                        onValueChange={(value) => {
                          const group = groupOptions.find(
                            (g) => String(g.id) === value
                          );
                          if (!group) return;
                          updateStep(service.supplierServiceId, 0, {
                            processGroupId: Number(group.id),
                            processGroupName: group.label,
                          });
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Grupo de ${service.serviceDescription}`}
                        >
                          <SelectValue placeholder="Seleccionar grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupOptions.map((group) => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      {/* Un Select y no una fila de radios: un servicio
                          pertenece a UN proceso, asi que la eleccion es entre
                          N opciones -- y con un desplegable añadir procesos no
                          ensancha la tabla. Opcional: el eje es el grupo. */}
                      <Select
                        value={
                          step?.processId ? String(step.processId) : undefined
                        }
                        onValueChange={(value) => {
                          const process = visibleGroups.find(
                            (p) => String(p.id) === value
                          );
                          if (!process) return;
                          updateStep(service.supplierServiceId, 0, {
                            processId: Number(process.id),
                            processName: process.label,
                          });
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Proceso de ${service.serviceDescription}`}
                        >
                          <SelectValue placeholder="Sin proceso" />
                        </SelectTrigger>
                        <SelectContent>
                          {visibleGroups.map((process, index) => (
                            <SelectItem key={process.id} value={String(process.id)}>
                              {index + 1}. {process.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      {/* maxDate null: es una fecha al futuro, y el tope de
                          hoy que DateField trae por defecto la bloquearía. */}
                      <DateField
                        value={service.promisedDate || null}
                        onChange={(value) =>
                          setServicePromisedDate(
                            service.supplierServiceId,
                            value,
                          )
                        }
                        maxDate={null}
                        showClear
                        placeholder="Sin fecha"
                      />
                    </TableCell>

                    <TableCell>
                      {/* Varios ítems por servicio: la costura va sobre el polo
                          M y el L a la vez. Sin ninguno marcado el backend lo
                          reparte entre todos, de ahí "Todos". */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-between font-normal"
                          >
                            {itemsLabel(step?.productionOrderItemIds ?? [])}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2" align="start">
                          <ul className="space-y-1">
                            {items.map((item) => {
                              const marked = (
                                step?.productionOrderItemIds ?? []
                              ).includes(item.id);
                              return (
                                <li key={item.id}>
                                  <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm">
                                    <Checkbox
                                      checked={marked}
                                      onCheckedChange={() =>
                                        toggleItem(
                                          service.supplierServiceId,
                                          item.id
                                        )
                                      }
                                    />
                                    <span className="flex-1">{item.name}</span>
                                    <span className="text-muted-foreground font-mono text-xs">
                                      {item.quantity}
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-muted-foreground border-t px-2 pt-2 text-xs">
                            Sin marcar ninguno, el servicio se reparte entre
                            todas las prendas.
                          </p>

                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    {onUnlinkService && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={unlinkingId === service.supplierServiceId}
                          onClick={() =>
                            onUnlinkService(service.supplierServiceId)
                          }
                          title="Quitar el servicio de la orden"
                          aria-label={`Quitar ${service.serviceDescription} de la orden`}
                        >
                          {unlinkingId === service.supplierServiceId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProcessCatalogFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        saving={creating}
        onSave={handleCreate}
        entityLabel="Grupo"
      />

      {/* Uno solo para toda la lista, no uno por proceso: el diálogo es el
          mismo y lo que cambia es a qué proceso apunta. */}
      {quoteFor && productionOrderId !== null && (
        <QuotationFromProcessDialog
          open
          onOpenChange={(next) => {
            if (!next) setQuoteFor(null);
          }}
          productionOrderId={productionOrderId}
          productionOrderCode={productionOrderCode}
          processGroupId={quoteFor.processGroupId}
          processName={quoteFor.processGroupName}
          stepOrder={quoteFor.stepOrder}
          orderQuantity={orderQuantity}
          // Las prendas de la orden, que este diálogo ya tiene cargadas: de
          // cada una elegida nace su propio servicio.
          items={items}
          onCreated={() => {
            // El servicio nuevo ya viene asignado al proceso, así que la
            // tabla de abajo lo tiene que ver sin guardar nada.
            reload();
            onSaved?.();
          }}
        />
      )}
      </div>
      </DialogContent>
    </Dialog>
  );
};
