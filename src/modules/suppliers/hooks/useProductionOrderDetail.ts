import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { deleteServiceLinkApi } from "../services/productionOrderServices.service";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  ExplosionOption,
  ProductionOrderClassOption,
  ProductionOrderItem,
  ProductionOrderStatus,
  ProductionOrderType,
} from "../types/productionOrders.types";
import {
  createProductionOrderApi,
  explosionOptionsApi,
  productionOrderByIdApi,
  productionOrderClassesApi,
  updateProductionOrderApi,
} from "../services/productionOrders.service";

interface UseProductionOrderDetailOptions {
  /** `undefined` o "new" abren el formulario en modo creación. */
  idParam?: string;
}

/** Ítem vacío que se añade al pulsar "Añadir ítem". */
const emptyItem = (): ProductionOrderItem => ({
  name: "",
  quantity: 0,
  // Un ítem que todavía no existe no puede haber recibido nada, ni haber
  // salido de ningún proceso.
  received: 0,
  intakeClosed: false,
  routeOutput: null,
  explosionId: null,
  explosionDescription: null,
  explosionModelCode: null,
  explosionTotal: null,
  variationId: null,
  variationSku: null,
  productId: null,
  productTitle: null,
  sizeTermId: null,
  sizeTerm: null,
  sizeGroup: null,
  otherTerms: null,
  variationLabel: null,
  categories: [],
  tags: [],
  productImages: [],
});

export const useProductionOrderDetail = ({
  idParam,
}: UseProductionOrderDetailOptions) => {
  const navigate = useNavigate();
  const isNew = !idParam || idParam === "new";
  const orderId = isNew ? null : Number(idParam);

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);

  const [classes, setClasses] = useState<ProductionOrderClassOption[]>([]);
  const [explosions, setExplosions] = useState<ExplosionOption[]>([]);
  /**
   * Las recetas de cada prenda, por variación.
   *
   * Aparte de la lista general y no mezcladas con ella: la general es una
   * página que además se reemplaza al buscar, así que una receta guardada aquí
   * desaparecería en cuanto alguien teclee. Estas son las del ítem y tienen
   * que seguir estando.
   */
  const [explosionsByVariation, setExplosionsByVariation] = useState<
    Record<number, ExplosionOption[]>
  >({});

  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ProductionOrderItem[]>([]);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);
  /**
   * En qué punto está la orden. Lo calcula el backend a partir de sus
   * servicios, así que se guarda tal cual y se recarga con el resto: al
   * registrar un avance, `loadOrder` lo trae ya actualizado.
   */
  const [status, setStatus] = useState<ProductionOrderStatus | null>(null);
  /**
   * Origen de la orden. Solo se lee: lo fija el backend al crear. Una orden de
   * consignación (Overtake) se muestra en solo lectura y sin receta/materiales.
   */
  const [type, setType] = useState<ProductionOrderType | null>(null);
  /** Cuándo se registró la orden. Solo se lee: lo pone el backend al crear. */
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  /** Quién la creó. Solo se lee; el requerimiento lo imprime como solicitante. */
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  /** Entrega comprometida y término, como las teclea el input de fecha. */
  const [promisedDate, setPromisedDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  /**
   * La fecha de término tal como vino del backend.
   *
   * Es contra esta que la pantalla sabe si la tocaron: con la orden lanzada,
   * el botón de guardarla solo sale cuando hay algo distinto que mandar.
   */
  const [savedFinishDate, setSavedFinishDate] = useState("");
  /** OP-0001 / OM-0001. Solo se lee: lo fija el backend al crear. */
  const [code, setCode] = useState<string | null>(null);
  /**
   * La marca de la última edición, tal como llegó al abrir. Viaja de vuelta
   * al guardar para que el backend detecte si alguien tocó la orden entre
   * medias.
   */
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [explosionSearch, setExplosionSearch] = useState("");
  const debouncedExplosionSearch = useDebounce(explosionSearch, 300);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [classList, explosionList] = await Promise.all([
          productionOrderClassesApi(),
          explosionOptionsApi(),
        ]);
        setClasses(classList);
        setExplosions(explosionList);
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      }
    };
    loadCatalogs();
  }, []);

  /**
   * Las recetas de las prendas que hay en la orden.
   *
   * Una consulta por variación distinta, y solo por las que faltan: se piden
   * al servidor con su `variation_id`, que es lo único que garantiza
   * encontrarlas -- filtrar la lista general en cliente solo funcionaba si la
   * receta caía en la primera página.
   */
  useEffect(() => {
    const pendientes = [
      ...new Set(
        items
          .map((item) => item.variationId)
          .filter((id): id is number => id !== null),
      ),
    ].filter((id) => explosionsByVariation[id] === undefined);

    if (pendientes.length === 0) return;

    let cancelado = false;
    Promise.all(
      pendientes.map(async (variationId) => {
        try {
          return [variationId, await explosionOptionsApi(null, variationId)] as const;
        } catch {
          // Una prenda cuya consulta falla se queda sin lista propia y cae en
          // la general, que es el comportamiento de antes. No se avisa: no hay
          // nada que el usuario pueda hacer y el combobox sigue funcionando.
          return [variationId, []] as const;
        }
      }),
    ).then((pares) => {
      if (cancelado) return;
      setExplosionsByVariation((prev) => ({
        ...prev,
        ...Object.fromEntries(pares),
      }));
    });

    return () => {
      cancelado = true;
    };
  }, [items, explosionsByVariation]);

  useEffect(() => {
    if (debouncedExplosionSearch === "") return;

    explosionOptionsApi(debouncedExplosionSearch)
      .then(setExplosions)
      .catch(() => toast({ title: "Error al buscar explosiones", variant: "destructive" }));
  }, [debouncedExplosionSearch]);

  const loadOrder = useCallback(async () => {
    if (orderId === null) return;

    try {
      setLoading(true);
      const detail = await productionOrderByIdApi(orderId);
      setName(detail.name);
      setClassId(detail.productionOrderClassId.toString());
      setDescription(detail.description ?? "");
      setItems(detail.items);
      setStatus(detail.status);
      setType(detail.type);
      setCreatedAt(detail.createdAt);
      setCreatedByName(detail.createdByName);
      setPromisedDate(detail.promisedDate ?? "");
      setFinishDate(detail.finishDate ?? "");
      setSavedFinishDate(detail.finishDate ?? "");
      setCode(detail.code);
      setUpdatedAt(detail.updatedAt);
    } catch (error: any) {
      toast({ title: "Error al cargar la orden: " + error.message, variant: "destructive" });
      navigate("/suppliers/production-orders");
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  /** Lo único que se teclea de un ítem: cuántas prendas. */
  const setItemQuantity = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Number(value || 0) } : item
      )
    );
  };

  const setItemExplosion = (index: number, explosion: ExplosionOption | null) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              explosionId: explosion?.id ?? null,
              explosionDescription: explosion?.label ?? null,
            }
          : item
      )
    );
  };

  /** La prenda que sale de un ítem, tal como la devuelve el diálogo. */
  type ItemVariation = {
    id: number;
    sku: string | null;
    productTitle: string;
    label: string;
    categories: string[];
    tags: string[];
  };

  /** El ítem con esa prenda puesta (o quitada, con null). */
  const withVariation = (
    item: ProductionOrderItem,
    variation: ItemVariation | null
  ): ProductionOrderItem => ({
    ...item,
    variationId: variation?.id ?? null,
    variationSku: variation?.sku ?? null,
    productTitle: variation?.productTitle ?? null,
    variationLabel: variation?.label ?? null,
    // La clasificación llega con el producto elegido: así la fila la
    // muestra sin esperar a guardar y releer la orden.
    categories: variation?.categories ?? [],
    tags: variation?.tags ?? [],
  });

  /** Producto final del ítem: se elige o se crea desde el diálogo. */
  const setItemVariation = (index: number, variation: ItemVariation | null) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? withVariation(item, variation) : item))
    );
  };

  /**
   * Varias prendas desde un solo ítem: el diálogo creó S, M, L y XL de golpe.
   *
   * La primera va al ítem desde el que se abrió; por cada una de las demás se
   * inserta un ítem nuevo justo debajo, copiando cantidad y receta del
   * original. Así la orden queda con una fila por talla sin repetir el alta.
   * Los ids de ítem no se copian: los nuevos todavía no existen en la BD.
   */
  const setItemVariations = (index: number, variations: ItemVariation[]) => {
    if (variations.length === 0) return;
    setItems((prev) => {
      const base = prev[index];
      if (!base) return prev;
      const first = withVariation(base, variations[0]);
      const extra = variations
        .slice(1)
        .map((v) => withVariation({ ...base, received: 0, routeOutput: null }, v));
      return [...prev.slice(0, index), first, ...extra, ...prev.slice(index + 1)];
    });
  };

  const totalItemsQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "El nombre de la orden es obligatorio", variant: "destructive" });
      return;
    }
    if (!classId) {
      toast({ title: "La clase de orden es obligatoria", variant: "destructive" });
      return;
    }

    // quantity no va en el payload: lo calcula y guarda el SP desde los ítems.
    const payload = {
      name: name.trim(),
      production_order_class_id: parseInt(classId),
      description: description.trim() === "" ? null : description.trim(),
      expected_updated_at: updatedAt,
      promised_date: promisedDate || null,
      finish_date: finishDate || null,
      items: items.map((item) => ({
        // El id viaja para que el backend actualice el ítem en vez de
        // borrarlo y recrearlo: así conserva su avance por los procesos.
        ...(item.id === undefined ? {} : { id: item.id }),
        quantity: item.quantity || 0,
        explosion_id: item.explosionId,
        variation_id: item.variationId,
      })),
    };

    try {
      setSubmitting(true);

      if (isNew) {
        await createProductionOrderApi(payload);
        toast({ title: "Orden de producción creada exitosamente", variant: "success" });
      } else {
        await updateProductionOrderApi({ ...payload, id: orderId! });
        toast({ title: "Orden de producción actualizada exitosamente", variant: "success" });
      }

      navigate("/suppliers/production-orders");
    } catch (error: any) {
      // El choque del bloqueo optimista no es un error de la persona que
      // guarda: es que la orden cambió debajo. Se recarga con lo que hay
      // ahora en vez de dejarla mirando un formulario que ya no aplica.
      if (error?.conflict) {
        toast({
          title: "Alguien más editó esta orden",
          description:
            "Se recargó con los cambios de la otra persona. Revisa y vuelve a guardar lo tuyo.",
          variant: "destructive",
        });
        await loadOrder();
        return;
      }
      toast({
        title: (isNew ? "Error al crear la orden: " : "Error al actualizar la orden: ") +
          error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Quita un servicio de la orden. El SP aborta si ese servicio ya ingresó
   * stock: el movimiento subió stock de verdad y su trazabilidad pasa por
   * este vínculo.
   */
  const unlinkService = async (serviceId: number) => {
    if (orderId === null) return;
    try {
      setUnlinkingId(serviceId);
      await deleteServiceLinkApi(orderId, serviceId);
      toast({ title: "Servicio desvinculado", variant: "success" });
      await loadOrder();
    } catch (error: any) {
      toast({ title: error.message ?? "No se pudo desvincular", variant: "destructive" });
    } finally {
      setUnlinkingId(null);
    }
  };

  return {
    type,
    createdAt,
    createdByName,
    promisedDate,
    setPromisedDate,
    finishDate,
    setFinishDate,
    savedFinishDate,
    code,
    isNew,
    loading,
    status,
    unlinkingId,
    unlinkService,
    reloadOrder: loadOrder,
    submitting,
    classes,
    explosions,
    explosionsByVariation,
    name,
    setName,
    classId,
    setClassId,
    description,
    setDescription,
    items,
    addItem,
    removeItem,
    setItemQuantity,
    setItemExplosion,
    setItemVariation,
    setItemVariations,
    explosionSearch,
    setExplosionSearch,
    totalItemsQuantity,
    handleSubmit,
  };
};
