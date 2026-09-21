import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/modules/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { toast } from "@/shared/hooks/use-toast";
import { categoriesListApi } from "@/modules/products/services/Categories.service";
import { SimpleCategory } from "@/modules/products/types/Categories.types";
import { useProductionPlan } from "../../hooks/useProductionPlan";
import { ProductionPlanTable } from "./ProductionPlanTable";
import { ProductionPlanFilterBar } from "./ProductionPlanFilterBar";
import { ProductionPlanFilterModal } from "./ProductionPlanFilterModal";
import { ESTADO_POR_DEFECTO } from "../../hooks/useProductionPlan";
import { productionOrderClassesApi } from "../../services/productionOrders.service";
import { ProductionOrderClassOption } from "../../types/productionOrders.types";
import {
  ProductionPlanProcessCellData,
  ProductionPlanRouteService,
  ProductionPlanRouteStep,
  ProductionPlanRow,
} from "../../types/productionPlan.types";
import { ServiceProgressDialog } from "../services/ServiceProgressDialog";
import { ProcessDetailDialog } from "./ProcessDetailDialog";
import SupplierPaymentDialog from "../supplier-payments/SupplierPaymentDialog";
import { useServicePayment } from "../../hooks/useServicePayment";
import { MultiServiceProgressDialog } from "../services/MultiServiceProgressDialog";
import { ServiceProgressTarget } from "../../hooks/useServiceProgress";
import { itemDisplayName } from "../../utils/productionItemDisplay";
import { ReceiveProductionOrderDialog } from "../production-orders/ReceiveProductionOrderDialog";
import { productionOrderByIdApi } from "../../services/productionOrders.service";
import { ProductionOrderItem } from "../../types/productionOrders.types";

interface ProductionPlanGridProps {
  /** Acota la rejilla a una orden. Null = el Plan Maestro entero. */
  productionOrderId?: number | null;
  /** Qué columnas se pintan. Ver `ProductionPlanTable`. */
  scope?: "plan" | "order";
  /** Pulsar una fila. Sin él la fila no lleva a ninguna parte. */
  onOpenOrder?: (row: ProductionPlanRow) => void;
  /** Se llama tras avanzar o recibir, por si el padre recarga lo suyo. */
  onChanged?: () => void;
  /**
   * Acciones propias de la pantalla, a la derecha de la barra: «Configurar
   * ruta» y «Recibir varias» en la orden. El buscador y el filtro los pone la
   * rejilla cuando `scope` es `"plan"`.
   */
  toolbar?: ReactNode;
  /**
   * Envolver en una Card. El Plan Maestro es una pantalla y la lleva; dentro
   * de la pestaña de la orden ya hay una, y anidar dos deja un doble borde.
   */
  card?: boolean;
  /** Cuántas filas por página al abrir. */
  pageSize?: number;
  /**
   * El total que devuelve el backend. Lo pide el header del Plan Maestro, que
   * vive fuera de la rejilla y no tiene de dónde sacarlo.
   */
  onTotalChange?: (total: number) => void;
  /**
   * La descarga a Excel, que la pide el header del Plan Maestro. Sube igual
   * que `onTotalChange` y por el mismo motivo: el hook con los filtros vive
   * aquí dentro, y el botón fuera.
   *
   * Solo lo pasa el Plan Maestro: en la pestaña de la orden no hay header
   * donde ponerlo, así que ahí no se ofrece.
   */
  onExportChange?: (estado: { exportar: () => void; exportando: boolean }) => void;
}

/**
 * La rejilla del Plan Maestro con todo lo que se hace desde ella.
 *
 * Vive aparte de la página porque la usan DOS pantallas: el Plan Maestro, con
 * todas las órdenes, y la pestaña Avances de una orden, acotada a la suya. Lo
 * que se duplicaría si no —el cableado de los tres diálogos, que son los
 * mismos— es justo donde las dos se irían separando sin querer.
 *
 * Lo que cambia entre las dos es qué columnas se pintan (`scope`) y qué hay en
 * la barra de arriba (`toolbar`). El resto es idéntico a propósito.
 */
export const ProductionPlanGrid = ({
  productionOrderId = null,
  scope = "plan",
  onOpenOrder,
  onChanged,
  toolbar,
  card = true,
  pageSize,
  onTotalChange,
  onExportChange,
}: ProductionPlanGridProps) => {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [classes, setClasses] = useState<ProductionOrderClassOption[]>([]);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  /** Servicio cuyo avance se está registrando, o null. */
  const [progressFor, setProgressFor] = useState<ServiceProgressTarget | null>(
    null,
  );
  /** La prenda de la fila desde la que se abrió el avance. */
  const [progressItemId, setProgressItemId] = useState<number | null>(null);
  /**
   * El proceso ya avanzado que se está mirando, con todo lo que hace falta
   * para describirlo: el servicio, cómo se llama el paso, las cifras de la
   * prenda y a qué prenda pertenecen.
   */
  const [detailFor, setDetailFor] = useState<{
    service: ServiceProgressTarget;
    processName: string;
    celda: ProductionPlanProcessCellData | null;
    productionOrderId: number;
    productionOrderCode: string | null;
    productionOrderItemId: number;
    itemLabel: string;
    /** De dónde viene la prenda y a dónde va. Null en los extremos de la ruta. */
    previous: { processName: string; service: ServiceProgressTarget } | null;
    next: { processName: string; service: ServiceProgressTarget } | null;
  } | null>(null);

  /** Pagar el servicio del proceso, sin salir del plan. */
  const pago = useServicePayment();
  /**
   * El paso cuyas prendas se avanzan de una vez, y el servicio de la fila
   * desde la que se abrió (arranca marcado solo ese).
   */
  const [multiFor, setMultiFor] = useState<{
    step: ProductionPlanRouteStep;
    focusServiceId: number | null;
  } | null>(null);
  /** La variación que se está recibiendo, con su ítem ya cargado. */
  const [receiveFor, setReceiveFor] = useState<{
    id: number;
    /** Cómo se llama la orden en la guía de ingreso. */
    label: string;
    items: ProductionOrderItem[];
    /** La prenda de la fila: la unica que arranca marcada. */
    focusItemId: number | null;
  } | null>(null);

  // El mismo permiso que gobierna la orden: el plan no debe ser una puerta
  // trasera a lo que la orden protege. Mientras cargan los codes se asume que
  // no, para no enseñar la acción y quitarla después.
  const { permissionCodes, permissionsLoading, isAdmin } = useAuth();
  const canAdvance =
    !permissionsLoading &&
    (isAdmin || permissionCodes.includes("production_orders.edit"));

  const plan = useProductionPlan({ productionOrderId, pageSize });
  const { rows, pagination, loading, reload, routes, processes } = plan;

  // Catálogo para el modal de filtros. Es el mismo de las órdenes: la clase
  // que se filtra aquí es la de la orden a la que pertenece la prenda. Dentro
  // de una orden no hay filtros, así que tampoco hace falta pedirlos.
  useEffect(() => {
    if (scope !== "plan") return;
    productionOrderClassesApi().then(setClasses).catch(console.error);
    categoriesListApi().then(setCategories).catch(console.error);
  }, [scope]);

  useEffect(() => {
    onTotalChange?.(pagination.total);
    // Solo cuando cambia el total: el callback puede venir sin memoizar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.total]);

  useEffect(() => {
    onExportChange?.({ exportar: plan.handleExport, exportando: plan.exporting });
    // Como el de arriba: el callback puede venir sin memoizar, y lo que
    // importa es que el header tenga la versión vigente del handler -- lleva
    // los filtros dentro, así que cambia con ellos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.handleExport, plan.exporting]);

  const recargar = () => {
    reload();
    onChanged?.();
  };

  /**
   * El paso ANTERIOR o SIGUIENTE de esta prenda, con el servicio que lo cubre.
   *
   * Se filtra por prenda y no se toma el paso de al lado sin más: la ruta es de
   * la ORDEN y no todas sus prendas pasan por todos los procesos, así que el
   * proceso que viene después en la ruta puede no ser el que viene después
   * para esta talla. Lo que cuenta es qué pasos tienen un servicio que la
   * cubra.
   */
  const vecino = (
    steps: ProductionPlanRouteStep[],
    actual: ProductionPlanRouteStep | null,
    itemId: number,
    direccion: -1 | 1,
  ): { processName: string; service: ServiceProgressTarget } | null => {
    if (!actual) return null;

    const suyos = steps
      .filter((step) =>
        step.services.some((service) => service.itemIds.includes(itemId)),
      )
      .sort((a, b) => a.order - b.order);

    const indice = suyos.findIndex((step) => step.order === actual.order);
    if (indice === -1) return null;

    const destino = suyos[indice + direccion];
    if (!destino) return null;

    const service = destino.services.find((s) => s.itemIds.includes(itemId));
    if (!service) return null;

    return { processName: destino.processName, service: toTarget(service) };
  };

  /**
   * El servicio de la ruta y el que pide el diálogo nombran lo mismo de
   * distinta forma. Traducirlo aquí es más barato que renombrar el modelo.
   */
  const toTarget = (
    service: ProductionPlanRouteService,
  ): ServiceProgressTarget => ({
    id: service.supplierServiceId,
    description: service.serviceDescription,
    code: service.serviceCode,
    moduleId: service.moduleId,
    situationId: service.situationId,
    situationName: service.situationName,
    situationRowId: service.situationRowId,
    dispatched: service.dispatched,
    currency: service.currency,
    paymentTerms: service.paymentTerms,
    quantity: service.quantity,
    requestedQuantity: service.requestedQuantity,
    incomingQuantity: service.incomingQuantity,
    badQuantity: service.badQuantity,
    price: service.price,
    measurementUnit: service.measurementUnit,
    materialId: service.materialId,
    materialMeasurementUnit: service.materialMeasurementUnit,
    supplierName: service.supplierName,
    supplierDocumentType: service.supplierDocumentType,
    supplierDocumentNumber: service.supplierDocumentNumber,
    supplierAddress: service.supplierAddress,
    // Las prendas que cubre el paso. Con más de una, el diálogo pide el
    // desglose por talla en vez de un solo número. El nombre es producto y
    // variación --lo que distingue la S de la M-- y el sku va aparte.
    items: service.itemIds.map((id, index) => {
      const detalle = service.itemDetails.find((d) => d.id === id);
      const plano = service.itemNames[index] ?? `Prenda ${id}`;
      return {
        id,
        name: detalle ? itemDisplayName(detalle, plano) : plano,
        sku: detalle?.sku ?? null,
        // Talla por separado: la Orden de Servicio la pinta como columna.
        productTitle: detalle?.productTitle ?? null,
        sizeTermId: detalle?.sizeTermId ?? null,
        sizeTerm: detalle?.sizeTerm ?? null,
        sizeGroup: detalle?.sizeGroup ?? null,
        otherTerms: detalle?.otherTerms ?? null,
      };
    }),
  });

  const openProgress = (
    row: ProductionPlanRow,
    service: ProductionPlanRouteService,
  ) => {
    setProgressItemId(row.productionOrderItemId);
    setProgressFor(toTarget(service));
  };

  /** Varios servicios en el paso: el de esta fila arranca marcado. */
  const openProgressMany = (
    row: ProductionPlanRow,
    step: ProductionPlanRouteStep,
  ) => {
    const propio = step.services.find((service) =>
      service.itemIds.includes(row.productionOrderItemId),
    );
    setMultiFor({ step, focusServiceId: propio?.supplierServiceId ?? null });
  };

  // Referencia estable: el diálogo siembra su formulario cuando cambia.
  const multiServices = useMemo(
    () => (multiFor ? multiFor.step.services.map(toTarget) : []),
    [multiFor],
  );

  /**
   * Los ítems se piden AL ABRIR y no con la lista: son hasta 20 variaciones por
   * página y solo se recibe de una.
   *
   * Se recibe SOLO la variación de la fila, no la orden entera. La fila es una
   * variación, así que abrir el diálogo con las demás prendas de su orden sería
   * dejar recibir cosas que la fila no muestra — y el mismo botón repetido en
   * cada talla haría las ocho veces lo mismo.
   */
  const openReceive = async (row: ProductionPlanRow) => {
    try {
      const order = await productionOrderByIdApi(row.productionOrderId);
      const item = order.items.find(
        (candidate) => candidate.id === row.productionOrderItemId,
      );
      if (!item) {
        // La prenda ya no está en la orden: alguien la quitó desde que se
        // cargó la lista. Recargar es más útil que un diálogo vacío.
        toast({
          title: "La prenda ya no está en la orden",
          description: "Se actualizó la lista.",
        });
        recargar();
        return;
      }
      // Todas las prendas de la orden, con la de la fila marcada: desde aqui
      // se ingresa solo esa, o se marcan las demas, o todas de golpe.
      setReceiveFor({
        id: row.productionOrderId,
        label: row.productionOrderName,
        items: order.items,
        focusItemId: item.id ?? null,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "No se pudieron cargar las prendas de la orden",
        variant: "destructive",
      });
    }
  };

  const barra = (
    <div className="flex flex-wrap items-center gap-2">
      {scope === "plan" && (
        <ProductionPlanFilterBar
          search={plan.search}
          onSearchChange={plan.handleSearchChange}
          onOpen={() => setFilterModalOpen(true)}
          hasActiveFilters={plan.hasActiveFilters}
        />
      )}
      {toolbar}
    </div>
  );

  const cuerpo = (
    <>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ProductionPlanTable
          rows={rows}
          loading={loading}
          onOpenOrder={onOpenOrder}
          routes={routes}
          processes={processes}
          narrowed={
            // Un filtro, una búsqueda, o estar dentro de una orden: en los
            // tres casos la lista está acotada por algo, y el vacío no puede
            // decir que no queda nada pendiente.
            plan.hasActiveFilters ||
            Boolean(plan.search.trim()) ||
            scope === "order"
          }
          canAdvance={canAdvance}
          onAdvance={openProgress}
          onAdvanceMany={openProgressMany}
          onReceive={openReceive}
          onDetail={(row, service, step, celda, steps) =>
            setDetailFor({
              service: toTarget(service),
              processName: step?.processName ?? "",
              celda,
              productionOrderId: row.productionOrderId,
              productionOrderCode: row.productionOrderCode,
              productionOrderItemId: row.productionOrderItemId,
              itemLabel: itemDisplayName(row, `Prenda #${row.productionOrderItemId}`),
              previous: vecino(steps, step, row.productionOrderItemId, -1),
              next: vecino(steps, step, row.productionOrderItemId, 1),
            })
          }
          scope={scope}
        />
      </div>

      <PaginationBar
        pagination={pagination}
        onPageChange={plan.handlePageChange}
        onPageSizeChange={plan.handlePageSizeChange}
      />
    </>
  );

  return (
    <>
      {card ? (
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader>{barra}</CardHeader>
          <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
            {cuerpo}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col min-h-0 gap-3">
          {barra}
          {cuerpo}
        </div>
      )}

      {/* Lo que se viene a preguntar al pulsar un proceso terminado no es la
          lista de movimientos: es cuánto se pidió, cuánto llegó, cuándo se
          cerró y qué material lleva. Los movimientos siguen abajo, como
          respaldo de esas cifras. */}
      <ProcessDetailDialog
        open={detailFor !== null}
        onOpenChange={(open) => {
          if (!open) setDetailFor(null);
        }}
        service={detailFor?.service ?? null}
        processName={detailFor?.processName ?? ""}
        celda={detailFor?.celda ?? null}
        productionOrderCode={detailFor?.productionOrderCode ?? null}
        productionOrderItemId={detailFor?.productionOrderItemId ?? 0}
        itemLabel={detailFor?.itemLabel ?? ""}
        previous={detailFor?.previous ?? null}
        next={detailFor?.next ?? null}
        onPay={(service) => pago.open(service.id)}
      />

      {/* El pago se registra aquí mismo. El saldo no sale de la fila del plan:
          lo pregunta el hook al backend, que es el único que sabe si el
          servicio llegó a recepción y qué se le ha abonado ya. */}
      <SupplierPaymentDialog
        target={pago.row}
        paymentMethods={pago.paymentMethods}
        saving={pago.saving}
        onClose={pago.close}
        onSubmit={pago.submit}
      />

      {/* Uno solo para toda la tabla, no uno por fila: el diálogo es el mismo
          y lo que cambia es a qué servicio apunta. */}
      <ServiceProgressDialog
        open={progressFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProgressFor(null);
            setProgressItemId(null);
          }
        }}
        service={progressFor}
        focusItemId={progressItemId}
        onSaved={recargar}
        /* Se avanza en vivo: la fecha del movimiento es cuando se cambia la
           situación. Fechar hacia atrás es de registrar lo que ya pasó. */
        allowBackdating={false}
      />

      <MultiServiceProgressDialog
        open={multiFor !== null}
        onOpenChange={(open) => {
          if (!open) setMultiFor(null);
        }}
        services={multiServices}
        processName={multiFor?.step.processName ?? "el proceso"}
        focusServiceId={multiFor?.focusServiceId ?? null}
        onSaved={recargar}
      />

      {receiveFor && (
        <ReceiveProductionOrderDialog
          open
          onOpenChange={(open) => {
            if (!open) setReceiveFor(null);
          }}
          productionOrderId={receiveFor.id}
          productionOrderLabel={receiveFor.label}
          items={receiveFor.items}
          focusItemId={receiveFor.focusItemId}
          onReceived={() => {
            setReceiveFor(null);
            recargar();
          }}
        />
      )}

      {scope === "plan" && (
        <ProductionPlanFilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={plan.handleApplyFilters}
          filters={plan.filters}
          classes={classes}
          categories={categories}
          /* En el plan se limpia a PENDIENTE, que es como abre; en la pestaña
             de una orden se mira esa orden entera, así que a vacío. */
          defaultStatus={productionOrderId ? null : ESTADO_POR_DEFECTO}
        />
      )}
    </>
  );
};

export default ProductionPlanGrid;
