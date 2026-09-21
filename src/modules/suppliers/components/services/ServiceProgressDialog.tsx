import { useEffect, useRef, useState } from "react";
import { History, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/shared/components/date-range";
import {
  ServiceProgressTarget,
  useServiceProgress,
} from "../../hooks/useServiceProgress";
import { ServiceHistoryDialog } from "./ServiceHistoryDialog";
import {
  openProductionRemisionGuide,
  ProductionGuideLine,
} from "../../utils/productionRemisionGuide";

interface ServiceProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceProgressTarget | null;
  onSaved?: () => void;
  /**
   * Si se puede fechar el movimiento hacia atrás.
   *
   * En la vista de Servicios sí: ahí se registra lo que ya pasó, y un servicio
   * que llegó el martes se anota el jueves con el martes. Desde la orden de
   * producción no: ahí se avanza la ruta en vivo, y la fecha del movimiento es
   * el momento en que se cambia la situación. Preguntarla sobraba.
   */
  allowBackdating?: boolean;
  /**
   * La prenda desde la que se abrió el diálogo.
   *
   * Con ella el avance es de ESA prenda, y aparece el check para extenderlo a
   * las demás del servicio. Sin ella —la vista de Servicios, donde no hay
   * fila— se avanzan todas, como siempre.
   */
  focusItemId?: number | null;
}

/**
 * Avance de un servicio, desde la vista general de Servicios.
 *
 * Hasta ahora esto solo se podía hacer entrando a la cotización, una por una.
 * El endpoint es el mismo; lo que cambia es desde dónde se llama.
 *
 * La fecha es la del movimiento, no la de hoy: el created_at de la fila de
 * situación es lo que se lee luego como fecha real de entrega, así que un
 * servicio que llegó el martes se registra con el martes aunque se teclee el
 * jueves.
 */
export const ServiceProgressDialog = ({
  open,
  onOpenChange,
  service,
  onSaved,
  allowBackdating = true,
  focusItemId = null,
}: ServiceProgressDialogProps) => {
  /** Si al guardar hay que ofrecer la guía de remisión. */
  const [printGuide, setPrintGuide] = useState(false);
  /**
   * Lo que se acaba de mandar, o null si todavía no se guardó. Con esto puesto
   * el diálogo no se cierra: el PDF se abre desde un botón, que es un click de
   * verdad — dentro del `await` del guardado lo bloquearía el navegador.
   */
  const [sent, setSent] = useState<ProductionGuideLine[] | null>(null);
  /** El formulario en el instante de guardar; `onSaved` se define antes. */
  const lineasRef = useRef<() => ProductionGuideLine[]>(() => []);

  const {
    situations,
    loadingSituations,
    form,
    setField,
    selectedSituation,
    saving,
    handleSubmit,
    splitByItem,
    itemTotals,
    expected,
    computedBad,
    setItemField,
    activeItems,
    advanceAll,
    setAdvanceAll,
  } = useServiceProgress({
    service,
    open,
    focusItemId,
    onSaved: () => {
      onSaved?.();
      if (!printGuide) {
        onOpenChange(false);
        return;
      }
      setSent(lineasRef.current());
    },
  });

  /** El historial de ESTE servicio, abierto desde la cabecera. */
  const [historyOpen, setHistoryOpen] = useState(false);

  // Lo que se manda: por prenda cuando el servicio cubre varias, y el total
  // suelto cuando cubre una.
  lineasRef.current = () =>
    service === null
      ? []
      : activeItems.map((item) => ({
          service,
          itemId: item.id,
          quantity: splitByItem
            ? Number(form.items[item.id]?.quantity || 0)
            : Number(form.quantity || 0),
        }));

  // Cada apertura arranca limpia, y la casilla solo viene marcada si hay a
  // quién mandarle.
  useEffect(() => {
    if (!open) return;
    setSent(null);
    setPrintGuide(Boolean(service?.supplierName));
  }, [open, service]);

  if (!service) return null;

  const unit =
    service.materialMeasurementUnit ?? service.measurementUnit ?? "UND";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Avance del servicio
            {/* Consultar y registrar son dos cosas distintas, pero se
                preguntan en el mismo momento. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs font-normal"
              onClick={() => setHistoryOpen(true)}
              title="Ver los movimientos del servicio"
            >
              <History className="h-3.5 w-3.5" />
              Historial
            </Button>
          </DialogTitle>
          <DialogDescription>
            {service.description}
            {service.code ? ` · ${service.code}` : ""} — situación actual:{" "}
            {service.situationName || "—"}
          </DialogDescription>
        </DialogHeader>

        {sent !== null ? (
          <div className="space-y-4 py-4">
            <p className="text-sm">Avance registrado.</p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => openProductionRemisionGuide(sent)}
            >
              <Printer className="h-4 w-4" />
              Imprimir guía de remisión
            </Button>
          </div>
        ) : (
        <div className="max-h-[60vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-2 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="situation">Nueva situación *</Label>
                <Select
                  value={form.situationId}
                  onValueChange={(value) => setField("situationId", value)}
                  disabled={loadingSituations}
                >
                  <SelectTrigger id="situation">
                    <SelectValue
                      placeholder={
                        loadingSituations
                          ? "Cargando situaciones..."
                          : "Seleccione la situación"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {situations.map((situation) => (
                      <SelectItem
                        key={situation.id}
                        value={situation.id.toString()}
                      >
                        {situation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Con varias prendas el avance se declara POR TALLA.
                  De un mismo proceso puede salir más de una talla y menos de
                  otra, y es lo que salió de cada una lo que pasa al proceso
                  siguiente -- un solo número para el conjunto no lo dice.

                  Los totales de abajo se CALCULAN de estas casillas en vez de
                  teclearse: así la suma cuadra por construcción. El backend lo
                  valida igual, pero de este modo no se llega a un error que el
                  usuario no sabría corregir. */}
              {splitByItem && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Cuánto salió de cada prenda ({unit})</Label>
                    {/* El avance es de la prenda de la fila. El check lo
                        extiende a las demás del servicio, que es el caso de
                        "salieron todas juntas". Sin prenda enfocada --la vista
                        de Servicios-- no hay nada que extender. */}
                    {focusItemId !== null && service.items.length > 1 && (
                      <label className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={advanceAll}
                          onCheckedChange={(value) =>
                            setAdvanceAll(value === true)
                          }
                          aria-label="Pasar todas las prendas del servicio"
                        />
                        Pasar todas las prendas del servicio
                      </label>
                    )}
                  </div>
                  <div className="divide-y rounded-md border">
                    <div className="text-muted-foreground grid grid-cols-[1fr_5rem_5rem] gap-3 px-3 py-2 text-xs">
                      <span>Prenda</span>
                      <span className="text-right">Buenas</span>
                      <span className="text-right">Merma</span>
                    </div>
                    {activeItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_5rem_5rem] items-center gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm" title={item.name}>
                            {item.name}
                          </div>
                          {item.sku && (
                            <div className="text-muted-foreground text-xs tabular-nums">
                              {item.sku}
                            </div>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right"
                          value={form.items[item.id]?.quantity ?? ""}
                          onChange={(e) =>
                            setItemField(item.id, "quantity", e.target.value)
                          }
                          aria-label={`Buenas de ${item.name}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right"
                          value={form.items[item.id]?.badQuantity ?? ""}
                          onChange={(e) =>
                            setItemField(item.id, "badQuantity", e.target.value)
                          }
                          aria-label={`Merma de ${item.name}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad ({unit})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={
                      splitByItem
                        ? String(itemTotals?.quantity ?? 0)
                        : form.quantity
                    }
                    onChange={(e) => setField("quantity", e.target.value)}
                    readOnly={splitByItem}
                    className={splitByItem ? "bg-muted" : undefined}
                    title={
                      splitByItem
                        ? "Es la suma de las buenas de cada prenda"
                        : undefined
                    }
                  />
                  {/* La cantidad de una situación es el ACUMULADO, no lo que
                      llega ahora: el stock se mueve por diferencia con la
                      anterior. En una segunda entrega se escribe el total. */}
                  {!splitByItem && service?.quantity !== null && service?.quantity !== undefined && (
                    <p className="text-muted-foreground text-xs">
                      Ya declarado: {service.quantity}. Escribe el total acumulado, no solo lo que llega ahora.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bad-quantity">Merma ({unit})</Label>
                  {/* NO se teclea: se calcula.

                      Lo que se manda al taller vuelve como bueno o no vuelve,
                      y lo que no vuelve ES la merma. Pedirla aparte dejaba que
                      las dos cifras no cuadraran --50 buenas y 3 de merma
                      sobre 60 pedidas, y las 7 restantes en ningún sitio-- y
                      esa diferencia es justo lo que se paga o se reclama.

                      Sin referencia contra la que medir se deja escribir a
                      mano, que es mejor que inventar un cero. */}
                  <Input
                    id="bad-quantity"
                    type="number"
                    min="0"
                    value={
                      computedBad !== null
                        ? String(computedBad)
                        : splitByItem
                          ? String(itemTotals?.badQuantity ?? 0)
                          : form.badQuantity
                    }
                    onChange={(e) => setField("badQuantity", e.target.value)}
                    readOnly={computedBad !== null || splitByItem}
                    className={
                      computedBad !== null || splitByItem ? "bg-muted" : undefined
                    }
                    title={
                      computedBad !== null
                        ? `Lo que falta contra las ${expected} que había que devolver`
                        : splitByItem
                          ? "Es la suma de la merma de cada prenda"
                          : undefined
                    }
                  />
                  {computedBad !== null && (
                    <p className="text-muted-foreground text-xs">
                      {expected} a devolver − lo bueno. Si vuelve de más, queda
                      en 0.
                    </p>
                  )}
                </div>
              </div>

              {/* Oculto se queda en "", que el hook manda como null y el
                  backend resuelve como ahora -- no hace falta nada más. */}
              {allowBackdating && (
                <div className="space-y-2">
                  <Label htmlFor="occurred-on">Fecha del movimiento</Label>
                  {/* Sin fecha = ahora. Al pasar a la situación de recepción,
                      esta es la fecha real de entrega que se lee después. */}
                  <DateField
                    value={form.occurredOn || null}
                    onChange={(value) => setField("occurredOn", value ?? "")}
                    placeholder="Hoy"
                    showClear
                  />
                </div>
              )}

              {/* La mercadería sale hacia el taller que hace el proceso, y el
                  papel la acompaña. */}
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={printGuide}
                  onCheckedChange={(value) => setPrintGuide(value === true)}
                  aria-label="Imprimir guía de remisión"
                  className="mt-0.5"
                />
                <span>
                  Imprimir guía de remisión
                  {service.supplierName && (
                    <span className="text-muted-foreground">
                      {" "}
                      para {service.supplierName}
                    </span>
                  )}
                </span>
              </label>

              <div className="space-y-2">
                {/* El comentario es el unico sitio donde queda escrito POR QUE
                    falta lo que falta.

                    Cuando hay merma el rotulo lo dice y el campo pide la
                    razon; sin merma sigue siendo un comentario suelto y
                    opcional. Es el mismo campo -- supplier_service_situations
                    .message -- y se lee despues en el detalle del proceso: no
                    hacia falta uno nuevo, hacia falta que dijera para que es
                    justo cuando importa. */}
                <Label htmlFor="message">
                  {computedBad !== null && computedBad > 0
                    ? `Por qué faltan ${computedBad}`
                    : "Comentario"}
                </Label>
                <Textarea
                  id="message"
                  rows={2}
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder={
                    computedBad !== null && computedBad > 0
                      ? "Se quedaron en el taller, salieron falladas, se reprocesan..."
                      : "Opcional"
                  }
                />
              </div>


              {/* Lo que entra en este proceso es lo que salió del anterior, y
                  con eso abre el formulario. Se corrige si salió otra cosa. */}
              <p className="text-muted-foreground text-xs">
                La cantidad viene con lo que salió del proceso anterior:
                corrígela si salió otra cosa.
              </p>

              {service.materialId !== null && (
                <p className="text-muted-foreground text-xs">
                  Este servicio tiene material vinculado: al llegar a la
                  situación de recepción, el stock del material se ajusta solo
                  por la diferencia con la situación anterior.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {sent !== null ? "Cerrar" : "Cancelar"}
          </Button>
          <Button
            onClick={handleSubmit}
            className={sent !== null ? "hidden" : undefined}
            disabled={saving || !selectedSituation}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Registrar avance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ServiceHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        service={{
          id: service.id,
          description: service.description,
          code: service.code,
        }}
      />
    </Dialog>
  );
};
