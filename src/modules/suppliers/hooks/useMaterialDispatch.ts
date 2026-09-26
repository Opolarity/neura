import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { useAuth } from "@/modules/auth";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  classesByModuleCode,
  getWarehousesIsActiveTrue,
} from "@/shared/services/service";
import type { Warehouse } from "@/types/warehouse";
import { getUserWarehouse } from "@/modules/inventory/services/Movements.service";
import { getUserWarehouseAdapter } from "@/modules/inventory/adapters/Movements.adapter";
import type { UserSummary, UserSummaryApiResponse } from "@/modules/inventory/types/Movements.types";
import { productionOrdersListApi } from "../services/productionOrders.service";
import {
  materialVariationOptionsApi,
  materialVariationStockApi,
} from "../services/materialVariations.service";
import {
  createMaterialDispatchApi,
  materialDispatchPlanApi,
  productionOrderQuotationOptionsApi,
  supplierWarehouseOptionsApi,
} from "../services/materialDispatch.service";
import type { ProductionOrder } from "../types/productionOrders.types";
import type { MaterialVariationOption } from "../types/materialVariations.types";
import type {
  MaterialDispatchLine,
  MaterialDispatchPlan,
  ProductionOrderQuotationOption,
  ProductionOrderServiceOption,
  SupplierWarehouseOption,
} from "../types/materialDispatch.types";

/**
 * Enviar material a un taller: la pantalla que descuenta tela del almacén.
 *
 * Misma forma que el movimiento de productos: cabecera con usuario, almacén
 * y fecha; se elige a dónde va -- la orden, una cotización de esa orden y,
 * si hace falta, un servicio concreto de la cotización -- y el almacén del
 * proveedor donde entra; y se van agregando materiales con su cantidad.
 *
 * Los servicios de una orden se repiten por talla, por eso el destino es la
 * COTIZACIÓN: es lo que agrupa esos servicios bajo un proveedor. El servicio
 * queda opcional; vacío significa «para todos los de la cotización».
 *
 * En cuanto hay orden y cotización, la pantalla deja de empezar en blanco:
 * `sp_get_material_dispatch_plan` dice qué consumen esas prendas y cuánto de
 * eso el taller YA tiene, y las líneas nacen sembradas con la DIFERENCIA. No
 * es un límite — se puede subir la cantidad, quitar líneas o agregar un
 * material que no está en ninguna receta —: lo único que desaparece es tener
 * que acordarse de lo que ya se mandó la vez anterior.
 *
 * El origen deja de ser fijo. Era siempre el almacén del usuario, y eso hacía
 * invisible el caso que más cuesta: que el material esté en el taller de OTRO
 * proveedor. Ahora se elige, y la lista dice qué tiene cada almacén.
 */
export const useMaterialDispatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  /** Todos los almacenes del tenant, los de taller incluidos: son el origen. */
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [originWarehouseId, setOriginWarehouseId] = useState<number | null>(null);
  /** El tipo de stock PRD del tenant: es el único que mueve el envío. */
  const [stockTypeId, setStockTypeId] = useState<number | null>(null);

  // A dónde va: orden, cotización, servicio (opcional) y almacén del taller.
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [quotations, setQuotations] = useState<ProductionOrderQuotationOption[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<ProductionOrderQuotationOption | null>(null);
  const [selectedService, setSelectedService] =
    useState<ProductionOrderServiceOption | null>(null);
  const [supplierWarehouses, setSupplierWarehouses] = useState<SupplierWarehouseOption[]>([]);
  const [loadingSupplierWarehouses, setLoadingSupplierWarehouses] = useState(false);
  const [selectedSupplierWarehouse, setSelectedSupplierWarehouse] =
    useState<SupplierWarehouseOption | null>(null);

  // Qué va: materiales.
  const [materialSearch, setMaterialSearch] = useState("");
  // Lo que se agrega a mano es una VARIACIÓN: "Jersey 30/1 · Negro".
  const [materials, setMaterials] = useState<MaterialVariationOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialVariationOption | null>(null);
  const [lines, setLines] = useState<MaterialDispatchLine[]>([]);

  // Lo que hace falta y lo que el taller ya tiene.
  const [plan, setPlan] = useState<MaterialDispatchPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const debouncedOrderSearch = useDebounce(orderSearch, 400);
  const debouncedMaterialSearch = useDebounce(materialSearch, 400);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingInitial(true);
        const [summary, stockTypes, allWarehouses] = await Promise.all([
          user?.id ? getUserWarehouse() : Promise.resolve(null),
          classesByModuleCode("STK"),
          getWarehousesIsActiveTrue(),
        ]);
        setWarehouses(allWarehouses);
        if (summary) {
          const adaptado = getUserWarehouseAdapter(
            summary as unknown as UserSummaryApiResponse
          );
          setUserSummary(adaptado);
          // El almacén del usuario sigue siendo el origen por defecto: es de
          // donde sale casi siempre. Lo que cambia es que ahora se puede mover.
          setOriginWarehouseId(adaptado.warehouse_id ?? null);
        }
        const prd = stockTypes.find((t) => t.code === "PRD") ?? stockTypes[0];
        setStockTypeId(prd?.id ?? null);
      } catch (error) {
        toastError(error, "No se pudieron cargar los datos del envío");
      } finally {
        setLoadingInitial(false);
      }
    };
    void load();
  }, [user?.id]);

  // Órdenes: se buscan en el servidor, como en el vínculo de cotizaciones.
  useEffect(() => {
    let cancelado = false;
    setLoadingOrders(true);
    productionOrdersListApi({ search: debouncedOrderSearch || null, size: 20 })
      .then((res) => {
        if (!cancelado) setOrders(res.data);
      })
      .catch(() => {
        if (!cancelado) setOrders([]);
      })
      .finally(() => {
        if (!cancelado) setLoadingOrders(false);
      });
    return () => {
      cancelado = true;
    };
  }, [debouncedOrderSearch]);

  // Cotizaciones de la orden elegida. Cambiar de orden invalida lo de abajo.
  useEffect(() => {
    setSelectedQuotation(null);
    if (!selectedOrder) {
      setQuotations([]);
      return;
    }
    let cancelado = false;
    setLoadingQuotations(true);
    productionOrderQuotationOptionsApi(selectedOrder.id)
      .then((rows) => {
        if (!cancelado) setQuotations(rows);
      })
      .catch((error) => {
        if (!cancelado) {
          setQuotations([]);
          toastError(error, "No se pudieron cargar las cotizaciones de la orden");
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingQuotations(false);
      });
    return () => {
      cancelado = true;
    };
  }, [selectedOrder]);

  // Con la cotización llegan sus servicios y los almacenes de SU proveedor.
  useEffect(() => {
    setSelectedService(null);
    setSelectedSupplierWarehouse(null);
    if (!selectedQuotation) {
      setSupplierWarehouses([]);
      return;
    }
    let cancelado = false;
    setLoadingSupplierWarehouses(true);
    supplierWarehouseOptionsApi(selectedQuotation.supplierId)
      .then((rows) => {
        if (cancelado) return;
        setSupplierWarehouses(rows);
        // Con un solo almacén no hay nada que elegir.
        if (rows.length === 1) setSelectedSupplierWarehouse(rows[0]);
      })
      .catch((error) => {
        if (!cancelado) {
          setSupplierWarehouses([]);
          toastError(error, "No se pudieron cargar los almacenes del proveedor");
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingSupplierWarehouses(false);
      });
    return () => {
      cancelado = true;
    };
  }, [selectedQuotation]);

  /**
   * El plan del envío, y con él las líneas sembradas.
   *
   * Depende del destino porque lo que se descuenta es lo que ESE almacén ya
   * tiene. Al resembrar se conservan las líneas agregadas a mano: cambiar de
   * servicio no debería borrar lo que alguien acaba de escribir.
   */
  useEffect(() => {
    if (!selectedOrder || !selectedQuotation) {
      setPlan(null);
      setLines((prev) => prev.filter((line) => !line.fromPlan));
      return;
    }
    let cancelado = false;
    setLoadingPlan(true);
    materialDispatchPlanApi(
      selectedOrder.id,
      selectedQuotation.supplierQuotationId,
      selectedService?.supplierServiceId ?? null,
      selectedSupplierWarehouse?.warehouseId ?? null
    )
      .then((resultado) => {
        if (cancelado) return;
        setPlan(resultado);
        setLines((prev) => {
          const aMano = prev.filter((line) => !line.fromPlan);
          // Por variación: el plan ya trae el Negro y el Blanco por separado.
          const yaAMano = new Set(aMano.map((line) => line.materialVariationId));
          const delPlan = resultado.materials
            .filter((material) => !yaAMano.has(material.materialVariationId))
            .map((material) => {
              const stockByWarehouse: Record<number, number> = {};
              material.sources.forEach((source) => {
                stockByWarehouse[source.warehouseId] = source.stock;
              });
              const stock = originWarehouseId
                ? (stockByWarehouse[originWarehouseId] ?? 0)
                : 0;
              return {
                lineKey: `v${material.materialVariationId}`,
                materialId: material.materialId,
                materialVariationId: material.materialVariationId,
                materialName: material.materialName,
                measurementUnit: material.measurementUnit,
                stock,
                stockByWarehouse,
                required: material.required,
                alreadyAtDestination: material.alreadyAtDestination,
                suggested: material.suggested,
                sources: material.sources,
                fromPlan: true,
                // Sembrada con la diferencia, acotada a lo que de verdad hay
                // en el origen: proponer lo que el backend va a rechazar no
                // ayuda a nadie. Cero queda VACÍA, no en cero: el taller ya
                // lo tiene y mandarle igual tiene que ser un acto.
                quantity:
                  material.suggested > 0 && stock > 0
                    ? Math.min(material.suggested, stock)
                    : null,
              } satisfies MaterialDispatchLine;
            });
          return [...delPlan, ...aMano];
        });
      })
      .catch((error) => {
        if (!cancelado) {
          setPlan(null);
          toastError(error, "No se pudo calcular qué mandar al taller");
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingPlan(false);
      });
    return () => {
      cancelado = true;
    };
    // originWarehouseId a propósito FUERA: cambiar de origen no rehace el
    // plan --lo que hace falta no depende de dónde salga-- y resembrar
    // borraría las cantidades escritas. El stock por línea se recalcula abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder, selectedQuotation, selectedService, selectedSupplierWarehouse]);

  /**
   * Cambiar de origen NO vuelve a preguntar al servidor: cada línea ya trae su
   * saldo en todos los almacenes. La cantidad se recorta si el nuevo origen
   * tiene menos, porque no se puede mandar lo que no hay ahí.
   */
  useEffect(() => {
    setLines((prev) =>
      prev.map((line) => {
        const stock = originWarehouseId
          ? (line.stockByWarehouse[originWarehouseId] ?? 0)
          : 0;
        return {
          ...line,
          stock,
          quantity:
            line.quantity === null ? null : Math.min(line.quantity, stock) || null,
        };
      })
    );
  }, [originWarehouseId]);

  // Materiales: búsqueda en servidor.
  useEffect(() => {
    let cancelado = false;
    setLoadingMaterials(true);
    materialVariationOptionsApi({ search: debouncedMaterialSearch || null, size: 20 })
      .then((opciones) => {
        if (!cancelado) setMaterials(opciones);
      })
      .catch(() => {
        if (!cancelado) setMaterials([]);
      })
      .finally(() => {
        if (!cancelado) setLoadingMaterials(false);
      });
    return () => {
      cancelado = true;
    };
  }, [debouncedMaterialSearch]);

  /** Si una variación ya está en el envío, del plan o agregada a mano. */
  const isOptionTaken = useCallback(
    (option: MaterialVariationOption) =>
      lines.some((line) => line.materialVariationId === option.id),
    [lines]
  );

  /**
   * Agregar a mano un material que no está en ninguna receta.
   *
   * Se guarda el saldo de TODOS los almacenes, no solo el del origen actual:
   * es lo que permite cambiar de origen después sin volver a preguntar, igual
   * que en las líneas que vienen del plan.
   */
  const addMaterial = async () => {
    if (!selectedMaterial || isOptionTaken(selectedMaterial)) return;
    try {
      const entries = await materialVariationStockApi(selectedMaterial.id);
      const stockByWarehouse: Record<number, number> = {};
      entries
        .filter((e) => stockTypeId === null || e.stockTypeId === stockTypeId)
        .forEach((e) => {
          stockByWarehouse[e.warehouseId] =
            (stockByWarehouse[e.warehouseId] ?? 0) + (e.stock ?? 0);
        });

      setLines((prev) => [
        ...prev,
        {
          lineKey: `v${selectedMaterial.id}`,
          materialId: selectedMaterial.materialId,
          materialVariationId: selectedMaterial.id,
          materialName: selectedMaterial.label,
          measurementUnit: selectedMaterial.measurementUnit,
          stock: originWarehouseId ? (stockByWarehouse[originWarehouseId] ?? 0) : 0,
          stockByWarehouse,
          // No sale de ninguna receta: no necesita nada, que no es lo mismo
          // que necesitar cero.
          required: null,
          alreadyAtDestination: selectedSupplierWarehouse
            ? (stockByWarehouse[selectedSupplierWarehouse.warehouseId] ?? 0)
            : 0,
          suggested: null,
          sources: [],
          fromPlan: false,
          quantity: null,
        },
      ]);
      setSelectedMaterial(null);
    } catch (error) {
      toastError(error, "No se pudo leer el stock del material");
    }
  };

  const removeLine = (lineKey: string) =>
    setLines((prev) => prev.filter((line) => line.lineKey !== lineKey));

  /** La cantidad, acotada al stock: no se puede mandar lo que no hay. */
  const setLineQuantity = (lineKey: string, raw: string) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.lineKey !== lineKey) return line;
        if (raw.trim() === "") return { ...line, quantity: null };
        const value = Number(raw);
        if (!Number.isFinite(value) || value <= 0) return { ...line, quantity: null };
        return { ...line, quantity: Math.min(value, line.stock) };
      })
    );
  };

  /**
   * De dónde puede salir. Todos los almacenes del tenant menos el destino
   * --origen y destino iguales los rechaza el backend--, con lo que cada uno
   * tiene de las líneas del envío para poder elegir con criterio.
   *
   * Los de OTROS talleres entran: mover de taller a taller es legítimo y el
   * backend ya lo admite. Si el proveedor no hace el papeleo, registrarlo aquí
   * es lo que deja la trazabilidad.
   */
  const originOptions = useMemo(
    () =>
      warehouses
        .filter((w) => w.id !== selectedSupplierWarehouse?.warehouseId)
        .map((w) => ({
          warehouseId: w.id,
          name: w.name,
          isSupplier: Boolean(w.supplier_id),
          /** Cuántas de las líneas de este envío tienen saldo aquí. */
          conStock: lines.filter((line) => (line.stockByWarehouse[w.id] ?? 0) > 0)
            .length,
        }))
        // Primero los míos, y dentro de cada grupo los que más cubren.
        .sort(
          (a, b) =>
            Number(a.isSupplier) - Number(b.isSupplier) ||
            b.conStock - a.conStock ||
            a.name.localeCompare(b.name)
        ),
    [warehouses, selectedSupplierWarehouse, lines]
  );

  const canSubmit =
    !submitting &&
    selectedOrder !== null &&
    selectedQuotation !== null &&
    selectedSupplierWarehouse !== null &&
    originWarehouseId !== null &&
    lines.some((line) => line.quantity !== null && line.quantity > 0);

  const submit = async () => {
    if (!selectedOrder || !selectedQuotation) {
      toast({ title: "Elige la orden y la cotización de destino", variant: "destructive" });
      return;
    }
    if (!selectedSupplierWarehouse) {
      toast({ title: "Elige el almacén del proveedor", variant: "destructive" });
      return;
    }
    if (!originWarehouseId) {
      toast({ title: "Elige el almacén de origen", variant: "destructive" });
      return;
    }
    // Las líneas SIN cantidad no se mandan: son las que el taller ya tiene,
    // que el plan siembra en blanco a propósito. Antes bloqueaban el envío.
    const aEnviar = lines.filter(
      (line) => line.quantity !== null && line.quantity > 0
    );
    if (aEnviar.length === 0) {
      toast({ title: "Ninguna línea tiene cantidad que enviar", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      await createMaterialDispatchApi({
        production_order_id: selectedOrder.id,
        supplier_quotation_id: selectedQuotation.supplierQuotationId,
        supplier_service_id: selectedService?.supplierServiceId ?? null,
        warehouse_id: originWarehouseId,
        destination_warehouse_id: selectedSupplierWarehouse.warehouseId,
        items: aEnviar.map((line) => ({
          material_id: line.materialId,
          material_variation_id: line.materialVariationId,
          quantity: line.quantity as number,
        })),
      });
      toast({ title: "Material enviado al taller", variant: "success" });
      navigate("/suppliers/material-movements");
    } catch (error) {
      toastError(error, "No se pudo registrar el envío");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loadingInitial,
    submitting,
    userSummary,
    originOptions,
    originWarehouseId,
    setOriginWarehouseId,
    plan,
    loadingPlan,
    orderSearch,
    setOrderSearch,
    orders,
    loadingOrders,
    selectedOrder,
    setSelectedOrder,
    quotations,
    loadingQuotations,
    selectedQuotation,
    setSelectedQuotation,
    selectedService,
    setSelectedService,
    supplierWarehouses,
    loadingSupplierWarehouses,
    selectedSupplierWarehouse,
    setSelectedSupplierWarehouse,
    materialSearch,
    setMaterialSearch,
    materials,
    loadingMaterials,
    selectedMaterial,
    setSelectedMaterial,
    isOptionTaken,
    lines,
    addMaterial,
    removeLine,
    setLineQuantity,
    canSubmit,
    submit,
  };
};
