import { useEffect, useRef, useState } from "react";
import { History, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ServiceProgressTarget } from "../../hooks/useServiceProgress";
import { useMultiServiceProgress } from "../../hooks/useMultiServiceProgress";
import { ServiceHistoryDialog, ServiceHistoryTarget } from "./ServiceHistoryDialog";
import {
  openProductionRemisionGuide,
  ProductionGuideLine,
} from "../../utils/productionRemisionGuide";

interface MultiServiceProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Los servicios del proceso. Referencia estable (useMemo en el padre). */
  services: ServiceProgressTarget[];
  processName: string;
  /** El servicio de la fila desde la que se abrió, o null para marcar todos. */
  focusServiceId?: number | null;
  onSaved?: () => void;
}

/**
 * Avanzar varias prendas de un proceso de una vez.
 *
 * Cada prenda del proceso tiene su servicio, y hasta ahora se avanzaban de
 * una en una. Aquí se listan todas con un check: se marca la que salió —o
 * las tres— y se registra cuánto salió de cada una. El nombre lleva producto
 * y variación, y el sku debajo, porque el sku solo no dice qué talla es.
 *
 * Sin fecha: se avanza en vivo, la del movimiento es ahora. Fechar hacia
 * atrás es de registrar lo que ya pasó, y eso no se hace desde aquí.
 */
export const MultiServiceProgressDialog = ({
  open,
  onOpenChange,
  services,
  processName,
  focusServiceId = null,
  onSaved,
}: MultiServiceProgressDialogProps) => {
  /** Servicio cuyo historial se está consultando, o null. */
  const [historyFor, setHistoryFor] = useState<ServiceHistoryTarget | null>(
    null,
  );
  /** Si al guardar hay que ofrecer la guía de remisión. */
  const [printGuide, setPrintGuide] = useState(true);
  /**
   * Lo que se acaba de mandar, o null si todavía no se guardó.
   *
   * Con esto puesto el diálogo no se cierra: enseña el botón de imprimir, que
   * tiene que ser un click de verdad. Abrir el PDF dentro del `await` del
   * guardado lo bloquearía el navegador, porque para él ya no es un gesto del
   * usuario.
   */
  const [sent, setSent] = useState<ProductionGuideLine[] | null>(null);
  /**
   * El formulario en el instante de guardar.
   *
   * Por referencia y no por closure: `onSaved` se define al construir el hook,
   * antes de que exista el estado que tiene que leer.
   */
  const advanceableRef = useRef<ServiceProgressTarget[]>([]);
  const selectedRef = useRef<Set<number>>(new Set<number>());
  const rowsRef = useRef<Record<number, { quantity: string; badQuantity: string }>>(
    {},
  );

  const {
    advanceable,
    excludedCount,
    selected,
    toggle,
    toggleAll,
    rows,
    setRowField,
    situationOptions,
    loadingSituations,
    situationId,
    setSituationId,
    selectedSituation,
    message,
    setMessage,
    saving,
    handleSubmit,
    selectedCount,
  } = useMultiServiceProgress({
    services,
    open,
    focusServiceId,
    onSaved: () => {
      onSaved?.();
      if (!printGuide) {
        onOpenChange(false);
        return;
      }
      setSent(
        advanceableRef.current
          .filter((service) => selectedRef.current.has(service.id))
          .map((service) => ({
            service,
            itemId: service.items[0]?.id ?? null,
            quantity: Number(rowsRef.current[service.id]?.quantity || 0),
          })),
      );
    },
  });

  advanceableRef.current = advanceable;
  selectedRef.current = selected;
  rowsRef.current = rows;

  // Cada apertura arranca limpia, y la casilla solo viene marcada si hay a
  // quién mandarle: sin proveedor la guía saldría sin destinatario.
  useEffect(() => {
    if (!open) return;
    setSent(null);
    setPrintGuide(Boolean(advanceable[0]?.supplierName));
  }, [open, advanceable]);

  const todas =
    advanceable.length > 0 && selectedCount === advanceable.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Avanzar {processName}</DialogTitle>
          <DialogDescription>
            Marca las prendas que salieron y registra cuánto salió de cada una.
            Las cantidades vienen con lo que salió del proceso anterior:
            corrígelas si salió otra cosa. Si una prenda ya tiene cantidad
            declarada, escribe el total acumulado: el stock se mueve por
            diferencia con lo anterior.
          </DialogDescription>
        </DialogHeader>

        {sent !== null ? (
          /* Ya guardado. El PDF se abre desde aquí y no solo, porque un
             `window.open` fuera de un click lo bloquea el navegador. */
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Avance registrado.{" "}
              {sent.length === 1
                ? "Se mandó 1 prenda."
                : `Se mandaron ${sent.length} prendas.`}
            </p>
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
                <Label htmlFor="multi-situation">Nueva situación *</Label>
                <Select
                  value={situationId}
                  onValueChange={setSituationId}
                  disabled={loadingSituations || selectedCount === 0}
                >
                  <SelectTrigger id="multi-situation">
                    <SelectValue
                      placeholder={
                        loadingSituations
                          ? "Cargando situaciones..."
                          : "Seleccione la situación"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {situationOptions.map((situation) => (
                      <SelectItem
                        key={situation.id}
                        value={situation.id.toString()}
                      >
                        {situation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* El destino vale para todas las marcadas: se ofrece desde
                    la más avanzada de ellas. */}
                <p className="text-muted-foreground text-xs">
                  Solo situaciones por delante de todas las prendas marcadas.
                </p>
              </div>

              <div className="divide-y rounded-md border">
                <div className="text-muted-foreground grid grid-cols-[1.5rem_1fr_7rem_5rem_5rem_2rem] items-center gap-3 px-3 py-2 text-xs">
                  <Checkbox
                    checked={todas}
                    onCheckedChange={(value) => toggleAll(value === true)}
                    aria-label="Marcar todas las prendas"
                  />
                  <span>Prenda</span>
                  <span>Situación actual</span>
                  <span className="text-right">Buenas</span>
                  <span className="text-right">Merma</span>
                  <span className="sr-only">Historial</span>
                </div>
                {advanceable.map((service) => {
                  const prenda = service.items[0];
                  const nombre = prenda?.name ?? service.description;
                  const marcado = selected.has(service.id);
                  return (
                    <div
                      key={service.id}
                      className="grid grid-cols-[1.5rem_1fr_7rem_5rem_5rem_2rem] items-center gap-3 px-3 py-2"
                    >
                      <Checkbox
                        checked={marcado}
                        onCheckedChange={(value) =>
                          toggle(service.id, value === true)
                        }
                        aria-label={`Avanzar ${nombre}`}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm" title={nombre}>
                          {nombre}
                        </div>
                        {prenda?.sku && (
                          <div className="text-muted-foreground text-xs tabular-nums">
                            {prenda.sku}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground truncate text-xs">
                        {service.situationName || "—"}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-right"
                        value={rows[service.id]?.quantity ?? ""}
                        onChange={(e) =>
                          setRowField(service.id, "quantity", e.target.value)
                        }
                        disabled={!marcado}
                        aria-label={`Buenas de ${nombre}`}
                      />
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-right"
                        value={rows[service.id]?.badQuantity ?? ""}
                        onChange={(e) =>
                          setRowField(
                            service.id,
                            "badQuantity",
                            e.target.value,
                          )
                        }
                        disabled={!marcado}
                        aria-label={`Merma de ${nombre}`}
                      />
                      {/* Consultar y registrar son dos cosas distintas, pero
                          la pregunta «¿por dónde ha pasado esta prenda?» se
                          hace justo aquí, al ir a moverla. */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          setHistoryFor({
                            id: service.id,
                            description: service.description,
                            code: service.code,
                          })
                        }
                        title="Ver los movimientos del servicio"
                        aria-label={`Ver historial de ${nombre}`}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {excludedCount > 0 && (
                <p className="text-muted-foreground text-xs">
                  {excludedCount === 1
                    ? "Un servicio de este proceso cubre varias prendas o no tiene situación vigente: se avanza desde su propio botón."
                    : `${excludedCount} servicios de este proceso cubren varias prendas o no tienen situación vigente: se avanzan desde su propio botón.`}
                </p>
              )}

              {/* La mercadería sale hacia el taller que hace el proceso, y
                  el papel la acompaña. Sin proveedor cargado la casilla viene
                  desmarcada: la guía saldría sin destinatario. */}
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={printGuide}
                  onCheckedChange={(value) => setPrintGuide(value === true)}
                  aria-label="Imprimir guía de remisión"
                  className="mt-0.5"
                />
                <span>
                  Imprimir guía de remisión
                  {advanceable[0]?.supplierName && (
                    <span className="text-muted-foreground">
                      {" "}
                      para {advanceable[0].supplierName}
                    </span>
                  )}
                </span>
              </label>

              <div className="space-y-2">
                <Label htmlFor="multi-message">Comentario</Label>
                <Textarea
                  id="multi-message"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Opcional, va en todas las marcadas"
                />
              </div>
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
            disabled={saving || !selectedSituation || selectedCount === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : selectedCount === 1 ? (
              "Avanzar 1 prenda"
            ) : (
              `Avanzar ${selectedCount} prendas`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ServiceHistoryDialog
        open={historyFor !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryFor(null);
        }}
        service={historyFor}
      />
    </Dialog>
  );
};

export default MultiServiceProgressDialog;
