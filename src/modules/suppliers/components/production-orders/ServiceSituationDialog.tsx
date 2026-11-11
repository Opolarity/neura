import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/shared/hooks/use-toast";
import {
  fetchSituationsByModuleId,
  SituationOption,
  updateServiceSituation,
} from "@/modules/quotations/services/Quotations.service";
import { SITUACION_PAGADO, SITUACIONES_COMERCIALES } from "../../hooks/useServiceProgress";
import { ServiceProcesses } from "../../types/productionOrderProcesses.types";

interface ServiceSituationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La cotización: cómo se llama, a qué taller, y sus servicios en esta orden. */
  quotationCode: string | null;
  supplierName: string;
  services: ServiceProcesses[];
  onSaved: () => void;
}

/** Los procesos que cubre un servicio, sin repetir. */
const procesosDe = (service: ServiceProcesses) =>
  [
    ...new Set(
      service.steps
        .map((step) => step.processGroupName ?? step.processName)
        .filter((name): name is string => !!name),
    ),
  ].join(", ");

/**
 * La situación de COTIZACIÓN de los servicios de una cotización: En
 * cotización o Cotizado, mientras no se hayan enviado.
 *
 * El avance de las prendas (enviar, recibir) se hace en el plan maestro, por
 * talla y con sus topes. «Pagado» no se marca aquí: es calculado, y el
 * servicio pasa solo a Pagado cuando sus pagos (Pagos a proveedores) lo saldan.
 *
 * Se cambia por servicio, marcando cuáles. La cantidad, las falladas y el
 * precio viajan tal cual: el backend copia el desglose por talla.
 */
export const ServiceSituationDialog = ({
  open,
  onOpenChange,
  quotationCode,
  supplierName,
  services,
  onSaved,
}: ServiceSituationDialogProps) => {
  const [situations, setSituations] = useState<SituationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [situationId, setSituationId] = useState("");
  const [saving, setSaving] = useState(false);

  const moduleId = services[0]?.moduleId ?? null;

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(services.map((service) => service.supplierServiceId)));
    setSituationId("");
    if (moduleId === null) return;
    const load = async () => {
      try {
        setLoading(true);
        setSituations(await fetchSituationsByModuleId(moduleId));
      } catch (error) {
        toast({
          title: "Error al cargar las situaciones",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open, services, moduleId]);

  // Solo cotización: Pagado lo pone el pago.
  const comerciales = useMemo(
    () =>
      situations.filter(
        (s) => SITUACIONES_COMERCIALES.includes(s.code ?? "") && s.code !== SITUACION_PAGADO,
      ),
    [situations],
  );

  /** Por qué ese servicio no admite esa situación, o null si la admite. */
  const motivo = (service: ServiceProcesses, destino: SituationOption): string | null => {
    if (service.situationRowId === null) return "Sin situación registrada";
    const actual = situations.find((s) => s.id === service.situationId) ?? null;
    if (actual?.id === destino.id) return "Ya está así";
    // Solo antes de enviarlo, y hacia delante.
    const actualEsCotizacion =
      !actual ||
      (SITUACIONES_COMERCIALES.includes(actual.code ?? "") && actual.code !== SITUACION_PAGADO);
    if (!actualEsCotizacion) return "Ya enviado";
    if (actual && (actual.order ?? -1) > (destino.order ?? -1)) return "No se retrocede";
    return null;
  };

  const marcados = services.filter((service) => selected.has(service.supplierServiceId));

  /** Las situaciones que valen para al menos uno de los marcados. */
  const opciones = comerciales.filter((destino) =>
    marcados.some((service) => motivo(service, destino) === null),
  );

  // Propone la que vale para todos los marcados, si hay una.
  useEffect(() => {
    if (!open || situationId !== "" || marcados.length === 0) return;
    const paraTodos = opciones.find((destino) =>
      marcados.every((service) => motivo(service, destino) === null),
    );
    if (paraTodos) setSituationId(String(paraTodos.id));
    // `motivo` depende de situations, ya en la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, situationId, marcados.length, opciones.length]);

  const destino = opciones.find((s) => s.id === Number(situationId)) ?? null;

  // Al desmarcar, la elegida puede dejar de valer: se vuelve a proponer.
  useEffect(() => {
    if (situationId !== "" && !loading && destino === null) setSituationId("");
  }, [situationId, loading, destino]);
  const aplicables = destino
    ? marcados.filter((service) => motivo(service, destino) === null)
    : [];

  const toggle = (id: number, value: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleSave = async () => {
    if (!destino || aplicables.length === 0) return;
    setSaving(true);
    const fallos: string[] = [];
    let hechos = 0;
    for (const service of aplicables) {
      try {
        await updateServiceSituation({
          supplierServiceSituationId: service.situationRowId as number,
          supplierServiceId: service.supplierServiceId,
          moduleId: service.moduleId,
          situationId: destino.id,
          statusId: destino.status_id,
          // Tal cual: con la misma cantidad el backend copia las tallas.
          quantity: service.quantity,
          badQuantity: service.badQuantity,
          message: null,
          measurementUnit: service.measurementUnit ?? "UND",
          price: service.price,
          occurredOn: null,
          items: null,
        });
        hechos += 1;
      } catch (error) {
        const detalle = error instanceof Error ? error.message : null;
        fallos.push(detalle ? `${service.serviceDescription}: ${detalle}` : service.serviceDescription);
      }
    }
    setSaving(false);

    if (fallos.length === 0) {
      toast({
        title: hechos === 1 ? "Situación cambiada" : `Situación cambiada en ${hechos} servicios`,
        variant: "success",
      });
      onOpenChange(false);
    } else {
      toast({
        title: `Cambiados ${hechos} de ${aplicables.length}`,
        description: `No se pudo cambiar: ${fallos.join(" · ")}`,
        variant: "destructive",
      });
    }
    // Siempre: aunque falle alguno, los anteriores ya cambiaron.
    onSaved();
  };

  const todos = services.length > 0 && marcados.length === services.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Situación {quotationCode ?? ""}</DialogTitle>
          <DialogDescription>
            {supplierName}. Si ya se cotizó. El pago se registra en Pagos a
            proveedores.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="service-situation" required>
              Nueva situación
            </Label>
            <Select
              value={situationId}
              onValueChange={setSituationId}
              disabled={loading || opciones.length === 0}
            >
              <SelectTrigger id="service-situation">
                <SelectValue
                  placeholder={
                    loading
                      ? "Cargando situaciones..."
                      : opciones.length === 0
                        ? "Nada que cambiar en los marcados"
                        : "Seleccione la situación"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((situation) => (
                  <SelectItem key={situation.id} value={String(situation.id)}>
                    {situation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y rounded-md border">
            <label className="text-muted-foreground flex items-center gap-3 px-3 py-2 text-xs">
              <Checkbox
                checked={todos}
                onCheckedChange={(value) =>
                  setSelected(
                    value === true
                      ? new Set(services.map((service) => service.supplierServiceId))
                      : new Set(),
                  )
                }
              />
              Todos
            </label>
            {services.map((service) => {
              const noAplica = destino ? motivo(service, destino) : null;
              const marcado = selected.has(service.supplierServiceId);
              return (
                <label
                  key={service.supplierServiceId}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Checkbox
                    checked={marcado}
                    onCheckedChange={(value) => toggle(service.supplierServiceId, value === true)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {service.serviceDescription}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {procesosDe(service) || "—"}
                    </div>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <Badge variant="secondary">{service.situationName || "Sin situación"}</Badge>
                    {marcado && noAplica && (
                      <div className="text-muted-foreground text-xs">{noAplica}</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !destino || aplicables.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {aplicables.length > 1 ? `Cambiar ${aplicables.length} servicios` : "Cambiar situación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
