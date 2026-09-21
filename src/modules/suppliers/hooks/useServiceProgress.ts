import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { ProductionItemSizeParts } from "../utils/productionItemDisplay";
import {
  fetchSituationsByModuleId,
  forwardSituations,
  SituationOption,
  updateServiceSituation,
} from "@/modules/quotations/services/Quotations.service";
/**
 * Lo que el avance necesita de un servicio, y nada más. Antes pedía un
 * `SupplierService` entero -- con su cotización, proveedor, clase y
 * variaciones, que no lee -- y eso lo ataba a la pantalla de Servicios. Con
 * esto encaja también el servicio que devuelve la orden de producción, sin
 * duplicar el diálogo ni inventar campos.
 *
 * `SupplierService` lo satisface estructuralmente: esa pantalla no cambia.
 */
export interface ServiceProgressTarget {
  id: number;
  description: string;
  code: string | null;
  moduleId: number;
  /** Situación vigente: desde ella se decide a cuáles se puede pasar. */
  situationId: number | null;
  situationName: string;
  /**
   * Si la mercadería ya salió hacia el taller. Mientras sea falso, el avance
   * que toca es el envío, y el diálogo abre con esa situación ya elegida.
   */
  dispatched?: boolean;
  /** Moneda pactada (ISO) y condición de pago: las imprime la Orden de Servicio. */
  currency?: string | null;
  paymentTerms?: string | null;
  /** Fila vigente a la que bajarle `last_row`. Sin ella no se puede avanzar. */
  situationRowId: number | null;
  /** Lo ULTIMO registrado. */
  quantity: number | null;
  /** Lo PEDIDO. Ultima red del sembrado. */
  requestedQuantity: number | null;
  /**
   * Lo que ENTRA en este paso: lo que salio bueno del anterior, o lo que pide
   * la orden en el primero. Es con lo que se siembra el avance.
   */
  incomingQuantity: number | null;
  badQuantity: number | null;
  price: number | null;
  measurementUnit: string | null;
  materialId: number | null;
  materialMeasurementUnit: string | null;
  /**
   * El proveedor que hace este proceso. Es el destinatario de la guía de
   * remisión con la que sale la mercadería hacia él. Puede faltar: la
   * dirección es un campo nuevo y los proveedores de antes no la tienen.
   */
  supplierName: string | null;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  supplierAddress: string | null;
  /**
   * Las prendas que cubre el servicio.
   *
   * Con más de una, el avance deja de ser un número suelto: hay que decir
   * cuánto salió de cada talla, porque es lo que pasa al proceso siguiente.
   * Con una sola no hay nada que repartir — el número ya es de ella.
   *
   * `name` es producto y variación («Polo Básico - S / Blanco»); el sku va
   * aparte y se pinta debajo, porque solo no dice qué talla es.
   */
  items: ({ id: number; name: string; sku: string | null } & ProductionItemSizeParts)[];
}

interface UseServiceProgressOptions {
  service: ServiceProgressTarget | null;
  /**
   * La prenda desde la que se abrio el dialogo.
   *
   * Con ella, el avance es de ESA prenda y no del servicio entero: es lo que
   * permite mover la M y dejar la S en el taller sin inventar un destino por
   * talla. Sin ella --la vista de Servicios, donde no hay fila-- se avanzan
   * todas, como siempre.
   */
  focusItemId?: number | null;
  /** El diálogo solo carga catálogos cuando está abierto. */
  open: boolean;
  onSaved?: () => void;
}

export interface ServiceProgressForm {
  situationId: string;
  quantity: string;
  badQuantity: string;
  message: string;
  /** Día civil de Lima "YYYY-MM-DD". Vacío = ahora. */
  occurredOn: string;
  /**
   * Lo bueno y la merma de cada prenda, por id. Solo se usa cuando el servicio
   * cubre varias: entonces los totales de arriba se calculan de aquí en vez de
   * teclearse, y así la suma cuadra por construcción en vez de por validación.
   */
  items: Record<
    number,
    {
      quantity: string;
      badQuantity: string;
    }
  >;
}

const emptyForm: ServiceProgressForm = {
  situationId: "",
  quantity: "",
  badQuantity: "",
  message: "",
  occurredOn: "",
  items: {},
};

/** "" → null; el resto a número. El 0 es un valor válido. */
const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Avanzar la situación de un servicio desde la vista general de Servicios.
 *
 * No duplica el endpoint: reutiliza el mismo `updateServiceSituation` que usa
 * el detalle de la cotización, que es el único sitio desde donde se podía
 * mover el avance hasta ahora.
 *
 * El stock y el costo del material vinculado NO se tocan desde aquí: los mueve
 * `trg_supplier_service_situation_sync_material` al insertarse la situación,
 * por delta contra la anterior. Escribirlos también desde el cliente sería la
 * segunda fuente del mismo dato.
 */
/**
 * «Enviado al proveedor» en el catálogo del módulo SPS.
 *
 * Por code y no por posición: comparte el `order` con «Cotizado», así que el
 * número no lo identifica. La base usa el mismo code en
 * `fn_supplier_service_is_dispatched`.
 */
const SITUACION_ENVIADO = "SENDP-HDN";

export const useServiceProgress = ({
  service,
  open,
  onSaved,
  focusItemId = null,
}: UseServiceProgressOptions) => {
  const [situations, setSituations] = useState<SituationOption[]>([]);
  const [loadingSituations, setLoadingSituations] = useState(false);
  const [form, setForm] = useState<ServiceProgressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  /** El check de "pasar todas las prendas del servicio". */
  const [advanceAll, setAdvanceAll] = useState(false);

  /**
   * Con varias prendas el avance se declara POR TALLA, no en un número suelto:
   * de un mismo proceso puede salir más de una talla y menos de otra, y es lo
   * que salió de cada una lo que pasa al proceso siguiente.
   */
  /**
   * Las prendas que este avance va a mover.
   *
   * Enfocada una y sin marcar "todas", es solo esa. Las demas NO viajan en el
   * payload: mandarlas con cero las moveria igualmente de situacion, que es
   * justo lo contrario de lo que se quiere.
   */
  const activeItems = useMemo(() => {
    if (!service) return [];
    if (advanceAll || focusItemId == null) return service.items;
    const enfocada = service.items.filter((item) => item.id === focusItemId);
    // Si la prenda enfocada no esta entre las del servicio, se cae al
    // comportamiento de siempre en vez de dejar el dialogo sin filas.
    return enfocada.length > 0 ? enfocada : service.items;
  }, [service, advanceAll, focusItemId]);

  // El servicio cubre varias: el backend necesita el desglose aunque este
  // avance mueva una sola.
  const splitByItem = (service?.items.length ?? 0) > 1;

  /**
   * Los totales salen del desglose cuando lo hay.
   *
   * Se CALCULAN en vez de teclearse para que la suma cuadre por construcción.
   * El backend valida igual —es él quien manda— pero así el usuario no puede
   * llegar a un error que no sabría corregir.
   */
  const itemTotals = useMemo(() => {
    if (!splitByItem || !service) return null;
    // Sobre las ACTIVAS: si el avance es de una prenda, el total del servicio
    // es el de esa prenda, y es lo que el backend exige que cuadre.
    return activeItems.reduce(
      (acc, item) => ({
        quantity: acc.quantity + Number(form.items[item.id]?.quantity || 0),
        badQuantity:
          acc.badQuantity + Number(form.items[item.id]?.badQuantity || 0),
      }),
      { quantity: 0, badQuantity: 0 },
    );
  }, [splitByItem, service, activeItems, form.items]);

  /**
   * Lo que este paso tenía que devolver.
   *
   * Lo que ENTRÓ --lo que salió bueno del proceso anterior-- y, si eso no se
   * sabe, lo que pide la orden. Es contra esto contra lo que se mide la merma.
   */
  const expected = useMemo(() => {
    if (!service) return null;
    return service.incomingQuantity ?? service.requestedQuantity ?? null;
  }, [service]);

  /**
   * La merma NO se teclea: se calcula.
   *
   * Lo que se manda al taller vuelve como bueno o no vuelve, y lo que no
   * vuelve ES la merma. Pedirla aparte dejaba que las dos cifras no cuadraran
   * --50 buenas y 3 de merma sobre 60 pedidas, y las 7 restantes en ningún
   * sitio-- y esa diferencia es justo lo que se paga o se reclama.
   *
   * Si vuelve MÁS de lo pedido, la merma es cero y no negativa: un excedente
   * no es una pérdida, y restarlo escondería el sobrante.
   *
   * Sin referencia --un servicio sin cantidad pedida ni entrante-- no hay
   * contra qué medir, y entonces se deja escribir a mano en vez de inventar
   * un cero.
   *
   * SOLO en el avance simple. Cuando se reparte por prenda, la merma que el
   * backend guarda es la de CADA prenda, y aquí no llega cuánto tenía que
   * devolver cada una: derivar el total y dejar los desgloses a mano daría dos
   * cifras que no cuadran. Ahí sigue siendo la suma de lo tecleado.
   */
  const computedBad = useMemo(() => {
    if (splitByItem || expected === null) return null;
    const bueno = Number(form.quantity || 0);
    if (Number.isNaN(bueno)) return null;
    return Math.max(expected - bueno, 0);
  }, [expected, splitByItem, form.quantity]);

  const setItemField = (
    itemId: number,
    field: "quantity" | "badQuantity",
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          quantity: "",
          badQuantity: "",
          ...prev.items[itemId],
          [field]: value,
        },
      },
    }));

  // Se siembra con lo que ya tiene la situación vigente: avanzar de estado
  // normalmente no cambia la cantidad, y obligar a reteclearla invita a
  // dejarla en blanco y perder el dato.
  useEffect(() => {
    if (!open || !service) {
      setForm(emptyForm);
      return;
    }

    setForm({
      situationId: "",
      // Lo que este paso TIENE QUE DEVOLVER: lo que entró del proceso
      // anterior o, en el primero, lo que pide la orden. Es lo que se
      // solicitó al taller, y por eso es con lo que abre el campo.
      //
      // Antes mandaba `quantity` --lo último declarado en ESTE servicio-- y
      // eso abría en 0 cuando todavía no se había declarado nada: había que
      // teclear a mano justo la cifra que el sistema ya sabía. Queda de
      // última red, para un servicio suelto sin proceso ni orden detrás.
      //
      // Se puede editar: el campo sigue siendo el acumulado y, en una segunda
      // entrega, el aviso de "ya declarado" recuerda lo que había.
      quantity: String(
        service.incomingQuantity ??
          service.requestedQuantity ??
          service.quantity ??
          "",
      ),
      badQuantity:
        service.badQuantity === null ? "" : String(service.badQuantity),
      // Vacío a propósito, y no repartido a ojo entre las tallas: cuánto salió
      // de cada una es justo el dato que hay que registrar. Sembrarlo sería
      // inventarlo, que es el error que ya se cometió antes (ver
      // fn_production_order_item_progress).
      items: {},
      message: "",
      occurredOn: "",
    });
    // Cada apertura arranca en "solo esta prenda": marcar todas es una
    // decision explicita, no un arrastre de la vez anterior.
    setAdvanceAll(false);
  }, [open, service]);

  useEffect(() => {
    if (!open || !service) return;

    const loadSituations = async () => {
      try {
        setLoadingSituations(true);
        // Solo hacia delante: retroceder desharía stock y costo ya movidos.
        const disponibles = forwardSituations(
          await fetchSituationsByModuleId(service.moduleId),
          service.situationId,
        );
        setSituations(disponibles);

        // Sin enviar todavía, el avance que toca es el envío: la mercadería
        // aún no ha salido del almacén. Se deja ELEGIDA, no impuesta -- el
        // desplegable sigue entero por si el envío se registra tarde y lo que
        // toca ya es otra cosa.
        if (service.dispatched === false) {
          const envio = disponibles.find(
            (situacion) => situacion.code === SITUACION_ENVIADO,
          );
          if (envio) {
            setForm((prev) =>
              prev.situationId === ""
                ? { ...prev, situationId: String(envio.id) }
                : prev,
            );
          }
        }
      } catch (error: any) {
        toast({
          title: "Error al cargar las situaciones: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingSituations(false);
      }
    };

    loadSituations();
  }, [open, service]);

  const setField = useCallback(
    (field: keyof ServiceProgressForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const selectedSituation = situations.find(
    (situation) => situation.id === Number(form.situationId),
  );

  const handleSubmit = async () => {
    if (!service || !selectedSituation) return;

    // Sin fila vigente no hay a qué bajarle last_row: el servicio se quedó sin
    // situación inicial y eso se arregla en la cotización, no aquí.
    if (service.situationRowId === null) {
      toast({
        title:
          "Este servicio no tiene una situación vigente sobre la que avanzar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await updateServiceSituation({
        supplierServiceSituationId: service.situationRowId,
        supplierServiceId: service.id,
        moduleId: service.moduleId,
        situationId: selectedSituation.id,
        statusId: selectedSituation.status_id,
        quantity: splitByItem
          ? itemTotals!.quantity
          : toNumberOrNull(form.quantity),
        // La calculada manda; solo se cae al campo cuando no hay referencia
        // contra la que medir.
        badQuantity:
          computedBad ??
          (splitByItem
            ? itemTotals!.badQuantity
            : toNumberOrNull(form.badQuantity)),
        message: form.message.trim() || null,
        // La unidad manda desde el material cuando lo hay; el trigger la
        // corrige igualmente, pero mandarla evita un NOT NULL en la inserción.
        measurementUnit:
          service.materialMeasurementUnit ?? service.measurementUnit ?? "UND",
        price: service.price,
        occurredOn: form.occurredOn || null,
        // Solo cuando hay varias prendas. Con una sola el total ya es suyo y
        // el backend no necesita que se lo repitan.
        // Solo las prendas que este avance mueve. Las que no viajan se quedan
        // donde estaban -- que es como una talla puede volver antes que otra
        // sin necesitar un destino propio por prenda: se avanza esa y ya.
        items: splitByItem
          ? activeItems.map((item) => ({
              production_order_item_id: item.id,
              quantity: Number(form.items[item.id]?.quantity || 0),
              bad_quantity: Number(form.items[item.id]?.badQuantity || 0),
            }))
          : null,
      });

      toast({ title: "Avance registrado", variant: "success" });
      onSaved?.();
    } catch (error: any) {
      toast({
        title: error?.message ?? "No se pudo registrar el avance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    situations,
    loadingSituations,
    form,
    setField,
    selectedSituation,
    saving,
    handleSubmit,
    /** Si el avance se declara por talla (el servicio cubre varias prendas). */
    splitByItem,
    activeItems,
    advanceAll,
    setAdvanceAll,
    /** Los totales calculados del desglose, o null si no aplica. */
    itemTotals,
    expected,
    computedBad,
    setItemField,
  };
};
