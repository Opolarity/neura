import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/shared/hooks/use-toast";
import {
  fetchSituationsByModuleId,
  SituationOption,
  updateServiceSituation,
} from "@/modules/quotations/services/Quotations.service";
import { ServiceProcesses } from "../../types/productionOrderProcesses.types";

/** «En cotización»: mientras está así el precio se sigue negociando. */
const SITUACION_EN_COTIZACION = "INQUO-HDN";

interface ServicePricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationCode: string | null;
  supplierName: string;
  services: ServiceProcesses[];
  onSaved: () => void;
}

/**
 * Los precios de los servicios de una cotización, desde la misma orden
 * (0238).
 *
 * Mientras un servicio está «En cotización» se sigue negociando y su precio se
 * cambia aquí. Al pasar a «Cotizado» el precio queda cerrado: se ve, pero ya no
 * se toca (el backend también lo rechaza). Cambiar el precio no cambia la
 * situación: se reenvía la misma, con la misma cantidad, y el backend
 * recalcula el total de la cotización.
 */
export const ServicePricesDialog = ({
  open,
  onOpenChange,
  quotationCode,
  supplierName,
  services,
  onSaved,
}: ServicePricesDialogProps) => {
  const [situations, setSituations] = useState<SituationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState<Record<number, string>>({});

  const moduleId = services[0]?.moduleId ?? null;

  useEffect(() => {
    if (!open) return;
    setPrices(
      Object.fromEntries(
        services.map((service) => [
          service.supplierServiceId,
          service.price === null || service.price === undefined ? "" : String(service.price),
        ]),
      ),
    );
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

  const enCotizacion = (service: ServiceProcesses) =>
    situations.find((s) => s.id === service.situationId)?.code === SITUACION_EN_COTIZACION;

  /** Los que cambiaron de precio y se pueden guardar. */
  const cambiados = services.filter((service) => {
    if (!enCotizacion(service) || service.situationRowId === null) return false;
    const nuevo = prices[service.supplierServiceId];
    if (nuevo === undefined || nuevo === "") return false;
    return Number(nuevo) !== Number(service.price ?? NaN);
  });

  const invalido = cambiados.some((service) => {
    const valor = Number(prices[service.supplierServiceId]);
    return !Number.isFinite(valor) || valor < 0;
  });

  const handleSave = async () => {
    if (cambiados.length === 0 || invalido) return;
    setSaving(true);
    const fallos: string[] = [];
    let hechos = 0;
    for (const service of cambiados) {
      const situacion = situations.find((s) => s.id === service.situationId);
      if (!situacion) continue;
      try {
        await updateServiceSituation({
          supplierServiceSituationId: service.situationRowId as number,
          supplierServiceId: service.supplierServiceId,
          moduleId: service.moduleId,
          // La misma situación: solo cambia el precio.
          situationId: situacion.id,
          statusId: situacion.status_id,
          quantity: service.quantity,
          badQuantity: service.badQuantity,
          message: "Precio en cotizacion",
          measurementUnit: service.measurementUnit ?? "UND",
          price: Number(prices[service.supplierServiceId]),
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
        title: hechos === 1 ? "Precio guardado" : `Precios guardados en ${hechos} servicios`,
        variant: "success",
      });
      onOpenChange(false);
    } else {
      toast({
        title: `Guardados ${hechos} de ${cambiados.length}`,
        description: `No se pudo guardar: ${fallos.join(" · ")}`,
        variant: "destructive",
      });
    }
    if (hechos > 0) onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Precios {quotationCode ? `· ${quotationCode}` : ""}</DialogTitle>
          <DialogDescription>
            {supplierName}. El precio se cambia mientras el servicio está «En cotización»; al pasar a
            «Cotizado» queda cerrado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {services.map((service) => {
              const abierto = enCotizacion(service);
              return (
                <div key={service.supplierServiceId} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{service.serviceDescription}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {service.situationName || "Sin situación"}
                    </div>
                  </div>
                  {abierto ? (
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 w-32 text-right tabular-nums"
                      value={prices[service.supplierServiceId] ?? ""}
                      onChange={(event) =>
                        setPrices((prev) => ({ ...prev, [service.supplierServiceId]: event.target.value }))
                      }
                      aria-label={`Precio de ${service.serviceDescription}`}
                    />
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {service.price === null || service.price === undefined ? "—" : service.price.toFixed(2)}
                      </span>
                      <Badge variant="secondary">Cerrado</Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || cambiados.length === 0 || invalido}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cambiados.length > 1 ? `Guardar ${cambiados.length} precios` : "Guardar precio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
