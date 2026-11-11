import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  fetchSituationsByModuleId,
  forwardSituations,
  SituationOption,
  updateServiceSituation,
} from "@/modules/quotations/services/Quotations.service";
import {
  esAvanceDePrendas,
  nextSituation,
  ServiceProgressTarget,
  SITUACION_ENVIO,
} from "./useServiceProgress";

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
  /** Los encargos que SÍ se guardaron (para la guía y el aviso). */
  onSaved?: (savedIds: number[]) => void;
}

interface RowForm {
  quantity: string;
  badQuantity: string;
  /**
   * Lo que salió del proceso anterior (en el primero, lo que pide la orden):
   * va en gris en la casilla de buenas para transcribirlo, no como valor.
   */
  suggestion?: string;
}

/** "" cuando no hay número; el 0 sí se escribe. */
const asText = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

/**
 * La clave de una fila del formulario: el servicio y, si cubre varias
 * prendas, cuál. Un servicio de una sola prenda es una fila; uno de varias,
 * una fila por talla.
 */
export const unitKey = (serviceId: number, itemId: number | null) =>
  `${serviceId}:${itemId ?? 0}`;

/** Las prendas que se piden por separado en un servicio (null = una sola fila). */
export const unitsOf = (service: ServiceProgressTarget): (number | null)[] =>
  service.items.length > 1 ? service.items.map((item) => item.id) : [service.items[0]?.id ?? null];

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
 * El servicio que cubre varias prendas pide una fila por talla y manda el
 * desglose: el backend guarda cuánto salió de cada una y la cabecera es la
 * suma.
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
  const [rows, setRows] = useState<Record<string, RowForm>>({});
  const [saving, setSaving] = useState(false);

  const advanceable = useMemo(
    () =>
      services.filter(
        (service) => service.situationRowId !== null,
      ),
    [services],
  );
  /** Los que no se ofrecen aquí, para decirlo en vez de esconderlos. */
  const excludedCount = services.length - advanceable.length;

  // Las buenas arrancan VACÍAS, con lo que entra del proceso anterior en gris
  // para transcribirlo (2026-11-11): sembrarlas como valor hacía que se
  // guardara sin mirar, y en 0 cuando el anterior aún no entregaba. Solo lo
  // ya declarado (> 0) queda escrito: ahí se escribe el total acumulado.
  // Cada apertura arranca limpia.
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
        advanceable.flatMap((service) =>
          service.items.length > 1
            ? // Cada talla con lo suyo: lo declarado, o en gris lo que le entró.
              unitsOf(service).map((itemId) => {
                const declarado = service.sizes?.find((s) => s.itemId === itemId);
                const entro = service.itemIncoming?.[itemId as number];
                return [
                  unitKey(service.id, itemId),
                  {
                    quantity: declarado && declarado.quantity > 0 ? String(declarado.quantity) : "",
                    badQuantity: declarado ? String(declarado.badQuantity) : "0",
                    suggestion: asText(entro ?? declarado?.quantity),
                  },
                ];
              })
            : [
                [
                  unitKey(service.id, service.items[0]?.id ?? null),
                  {
                    // Ya enviado con cantidad, lo último declarado. Si no, en
                    // gris lo SOLICITADO, igual que el diálogo de uno solo: lo
                    // que entra del proceso anterior y, en el primero, lo que
                    // pide la orden (y sin falladas: sumaban sobre lo pedido).
                    quantity:
                      service.dispatched && (service.quantity ?? 0) > 0
                        ? String(service.quantity)
                        : "",
                    badQuantity: service.dispatched
                      ? String(service.badQuantity ?? 0)
                      : "0",
                    suggestion: asText(
                      service.incomingQuantity ?? service.requestedQuantity ?? service.quantity,
                    ),
                  },
                ],
              ],
        ),
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
    // Solo el avance de prendas: lo comercial va en «Situación».
    return forwardSituations(situations, masAvanzada?.id ?? null).filter(esAvanceDePrendas);
  }, [situations, selectedServices]);

  const selectedSituation = situationOptions.find(
    (situation) => situation.id === Number(situationId),
  );

  // Propone la situación siguiente a la de los encargos marcados, como el
  // diálogo de uno solo. Solo si aún no se eligió ninguna.
  useEffect(() => {
    if (!open || situationId !== "" || selectedServices.length === 0) return;
    const masAvanzada = selectedServices.reduce<number | null>((mayor, service) => {
      const orden = situations.find((s) => s.id === service.situationId)?.order ?? null;
      if (orden === null) return mayor;
      return mayor === null || orden > mayor ? orden : mayor;
    }, null);
    const actual = situations.find(
      (s) => s.order === masAvanzada && selectedServices.some((sv) => sv.situationId === s.id),
    );
    // Sin enviar ninguno, lo que toca es el envío (comparte orden con
    // «Cotizado», así que «la siguiente» se lo saltaría).
    const propuesta = selectedServices.every((sv) => sv.dispatched === false)
      ? situationOptions.find((s) => s.code === SITUACION_ENVIO) ?? null
      : nextSituation(situationOptions, actual?.id ?? null);
    if (propuesta) setSituationId(String(propuesta.id));
  }, [open, situationId, selectedServices, situations, situationOptions]);

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

  const setRowField = (key: string, field: keyof RowForm, value: string) =>
    setRows((prev) => {
      // Desde la 0237 se puede declarar más de lo que entró (sobrantes): las
      // falladas ya no rebajan las buenas.
      const actual = { quantity: "", badQuantity: "", ...prev[key], [field]: value };
      return { ...prev, [key]: actual };
    });

  const handleSubmit = async () => {
    if (!selectedSituation || selectedServices.length === 0) return;

    // Las buenas ya no vienen escritas: una vacía se mandaba como 0 sin
    // avisar. Se pide escribirla (el 0 vale) antes de mover nada.
    const sinBuenas = selectedServices.flatMap((service) =>
      unitsOf(service)
        .filter((itemId) => (rows[unitKey(service.id, itemId)]?.quantity ?? "").trim() === "")
        .map(
          (itemId) =>
            service.items.find((item) => item.id === itemId)?.name ??
            service.items[0]?.name ??
            service.description,
        ),
    );
    if (sinBuenas.length > 0) {
      toast({
        title: "Falta escribir las buenas",
        description: sinBuenas.join(" · "),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const fallos: string[] = [];
    let avanzados = 0;
    const guardados: number[] = [];

    for (const service of selectedServices) {
      const porTalla = service.items.length > 1;
      const row = rows[unitKey(service.id, service.items[0]?.id ?? null)] ?? {
        quantity: "",
        badQuantity: "",
      };
      const desglose = porTalla
        ? unitsOf(service).map((itemId) => {
            const r = rows[unitKey(service.id, itemId)] ?? { quantity: "", badQuantity: "" };
            return {
              production_order_item_id: itemId as number,
              quantity: toNumberOrNull(r.quantity) ?? 0,
              bad_quantity: toNumberOrNull(r.badQuantity) ?? 0,
            };
          })
        : null;
      try {
        await updateServiceSituation({
          supplierServiceSituationId: service.situationRowId as number,
          supplierServiceId: service.id,
          moduleId: service.moduleId,
          situationId: selectedSituation.id,
          statusId: selectedSituation.status_id,
          // Con desglose la cabecera es la suma; el backend la rehace igual.
          quantity: desglose
            ? desglose.reduce((sum, d) => sum + d.quantity, 0)
            : toNumberOrNull(row.quantity),
          badQuantity: desglose
            ? desglose.reduce((sum, d) => sum + d.bad_quantity, 0)
            : toNumberOrNull(row.badQuantity),
          message: message.trim() || null,
          measurementUnit:
            service.materialMeasurementUnit ??
            service.measurementUnit ??
            "UND",
          price: service.price,
          // Se avanza en vivo: la fecha del movimiento es ahora.
          occurredOn: null,
          // Una prenda: el total ya es suyo. Varias: cuánto de cada talla.
          items: desglose,
        });
        avanzados += 1;
        guardados.push(service.id);
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
    onSaved?.(guardados);
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
