import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  fetchSituationsByModuleId,
  forwardSituations,
  SituationOption,
  updateServiceSituation,
} from "@/modules/quotations/services/Quotations.service";
import { ServiceProgressTarget } from "./useServiceProgress";

interface UseMultiServiceProgressOptions {
  /**
   * Los servicios del proceso. Tiene que ser una referencia estable (useMemo
   * en quien lo monta): el formulario se siembra cuando cambia.
   */
  services: ServiceProgressTarget[];
  open: boolean;
  /**
   * El servicio de la fila desde la que se abrió, o null. Con él arranca
   * marcado solo ese; sin él —el botón del proceso en la orden— arrancan
   * todos.
   */
  focusServiceId?: number | null;
  onSaved?: () => void;
}

interface RowForm {
  quantity: string;
  badQuantity: string;
}

/** El mensaje de un error, cuando lo trae. */
const errorMessage = (error: unknown): string | null =>
  error instanceof Error ? error.message : null;

/** "" → null; el resto a número. El 0 es un valor válido. */
const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Avanzar VARIOS servicios de un mismo proceso de una vez: uno por prenda.
 *
 * No hay endpoint de lote. Cada servicio se avanza con el mismo
 * `updateServiceSituation` de siempre, en secuencia: cada llamada es atómica
 * y valida por su cuenta (bloqueo por proceso posterior, cuadre de
 * cantidades), así que un fallo a mitad deja los anteriores bien avanzados y
 * aquí solo hay que decir cuál falló.
 *
 * Solo entran los servicios que cubren UNA prenda. El que cubre varias
 * necesita el desglose por talla, y eso es el diálogo de un solo servicio.
 */
export const useMultiServiceProgress = ({
  services,
  open,
  focusServiceId = null,
  onSaved,
}: UseMultiServiceProgressOptions) => {
  const [situations, setSituations] = useState<SituationOption[]>([]);
  const [loadingSituations, setLoadingSituations] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [situationId, setSituationId] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<Record<number, RowForm>>({});
  const [saving, setSaving] = useState(false);

  const advanceable = useMemo(
    () =>
      services.filter(
        (service) =>
          service.situationRowId !== null && service.items.length <= 1,
      ),
    [services],
  );
  /** Los que no se ofrecen aquí, para decirlo en vez de esconderlos. */
  const excludedCount = services.length - advanceable.length;

  // Se siembra como el diálogo de un servicio: con lo que se le solicitó. Cada
  // apertura arranca limpia.
  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setRows({});
      setSituationId("");
      setMessage("");
      return;
    }
    const ids = advanceable.map((service) => service.id);
    const enfocado = ids.includes(focusServiceId ?? -1);
    setSelected(new Set(enfocado ? [focusServiceId as number] : ids));
    setRows(
      Object.fromEntries(
        advanceable.map((service) => [
          service.id,
          {
            // Con lo SOLICITADO, igual que el diálogo de uno solo: lo que
            // entra del proceso anterior y, en el primero, lo que pide la
            // orden. Lo último declarado queda de última red.
            quantity: String(
              service.incomingQuantity ??
                service.requestedQuantity ??
                service.quantity ??
                "",
            ),
            badQuantity:
              service.badQuantity === null ? "" : String(service.badQuantity),
          },
        ]),
      ),
    );
    setSituationId("");
    setMessage("");
  }, [open, advanceable, focusServiceId]);

  // Las situaciones son del módulo, y los servicios de un proceso comparten
  // módulo: basta con las del primero.
  const moduleId = advanceable[0]?.moduleId ?? null;
  useEffect(() => {
    if (!open || moduleId === null) return;
    const load = async () => {
      try {
        setLoadingSituations(true);
        setSituations(await fetchSituationsByModuleId(moduleId));
      } catch (error) {
        toast({
          title:
            "Error al cargar las situaciones: " +
            (errorMessage(error) ?? "no se pudieron cargar"),
          variant: "destructive",
        });
      } finally {
        setLoadingSituations(false);
      }
    };
    load();
  }, [open, moduleId]);

  const selectedServices = useMemo(
    () => advanceable.filter((service) => selected.has(service.id)),
    [advanceable, selected],
  );

  /**
   * Solo hacia delante, y válido para TODOS los marcados: se filtra contra la
   * situación más avanzada de entre ellos. Si uno va por «En taller» y otro
   * por «Recibido», el destino tiene que estar por delante del segundo.
   */
  const situationOptions = useMemo(() => {
    const masAvanzada = selectedServices.reduce<SituationOption | null>(
      (mayor, service) => {
        const actual = situations.find((s) => s.id === service.situationId);
        if (!actual || actual.order == null) return mayor;
        return !mayor || (mayor.order ?? -1) < actual.order ? actual : mayor;
      },
      null,
    );
    return forwardSituations(situations, masAvanzada?.id ?? null);
  }, [situations, selectedServices]);

  const selectedSituation = situationOptions.find(
    (situation) => situation.id === Number(situationId),
  );

  const toggle = (serviceId: number, value: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(serviceId);
      else next.delete(serviceId);
      return next;
    });

  const toggleAll = (value: boolean) =>
    setSelected(
      value ? new Set(advanceable.map((service) => service.id)) : new Set(),
    );

  const setRowField = (
    serviceId: number,
    field: keyof RowForm,
    value: string,
  ) =>
    setRows((prev) => ({
      ...prev,
      [serviceId]: {
        quantity: "",
        badQuantity: "",
        ...prev[serviceId],
        [field]: value,
      },
    }));

  const handleSubmit = async () => {
    if (!selectedSituation || selectedServices.length === 0) return;

    setSaving(true);
    const fallos: string[] = [];
    let avanzados = 0;

    for (const service of selectedServices) {
      const row = rows[service.id] ?? { quantity: "", badQuantity: "" };
      try {
        await updateServiceSituation({
          supplierServiceSituationId: service.situationRowId as number,
          supplierServiceId: service.id,
          moduleId: service.moduleId,
          situationId: selectedSituation.id,
          statusId: selectedSituation.status_id,
          quantity: toNumberOrNull(row.quantity),
          badQuantity: toNumberOrNull(row.badQuantity),
          message: message.trim() || null,
          measurementUnit:
            service.materialMeasurementUnit ??
            service.measurementUnit ??
            "UND",
          price: service.price,
          // Se avanza en vivo: la fecha del movimiento es ahora.
          occurredOn: null,
          // Una prenda por servicio: el total ya es suyo.
          items: null,
        });
        avanzados += 1;
      } catch (error) {
        const nombre = service.items[0]?.name ?? service.description;
        const detalle = errorMessage(error);
        fallos.push(detalle ? `${nombre}: ${detalle}` : nombre);
      }
    }

    setSaving(false);

    if (fallos.length === 0) {
      toast({
        title:
          avanzados === 1
            ? "Avance registrado"
            : `Avance registrado en ${avanzados} prendas`,
        variant: "success",
      });
    } else {
      toast({
        title: `Avanzadas ${avanzados} de ${selectedServices.length}`,
        description: `No se pudo avanzar: ${fallos.join(" · ")}`,
        variant: "destructive",
      });
    }
    // Recargar siempre: aunque falle alguno, los anteriores ya se movieron.
    onSaved?.();
  };

  return {
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
    selectedCount: selectedServices.length,
  };
};
