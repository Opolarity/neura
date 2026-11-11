import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateField } from "@/shared/components/date-range";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/shared/components/page-loader";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import { materialRequirementApi } from "../services/materialRequirement.service";
import { updateProductionOrderFinishDateApi } from "../services/productionOrders.service";
import { productionOrderProcessesApi } from "../services/productionOrderProcesses.service";
import { openProductionOrderPdf } from "../utils/productionOrderPdf";
import { openMaterialRequirementPdf } from "../utils/materialRequirementPdf";
import { errorMessageOf } from "@/shared/utils/functionError";
import { Badge } from "@/components/ui/badge";
import { useProductionOrderDetail } from "../hooks/useProductionOrderDetail";
import { productionOrderStatusBadge } from "../utils/productionOrderStatus";
import { productionOrderTypeBadge } from "../utils/productionOrderType";
import { ProductionOrderItemsEditor } from "../components/production-orders/ProductionOrderItemsEditor";
import { OrderBoardCard } from "../components/production-orders/board/OrderBoardCard";
import { OrderActionsBar } from "../components/production-orders/OrderActionsBar";
import { ReceiveProductionOrderDialog } from "../components/production-orders/ReceiveProductionOrderDialog";
import { useOrderOverview } from "../hooks/useOrderOverview";
import { useAuth } from "@/modules/auth/hooks/useAuth";

const ProductionOrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { permissionCodes, isAdmin } = useAuth();
  const canEditOrder = isAdmin || permissionCodes.includes("production_orders.edit");
  /**
   * Se incrementa al recibir o al guardar: otra lista de prendas es otro
   * requerimiento y otra ruta, y las filas de la pizarra leen del backend por
   * su cuenta.
   */
  const [reloadKey, setReloadKey] = useState(0);
  /** Sube al avanzar, encargar o cortar desde la pizarra: el resumen se relee sin remontar. */
  const [overviewKey, setOverviewKey] = useState(0);
  const [printing, setPrinting] = useState(false);
  /** El requerimiento se pide aparte: es otro papel y otra espera. */
  const [printingRequirement, setPrintingRequirement] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const {
    createdAt,
    createdByName,
    promisedDate,
    setPromisedDate,
    issueDate,
    setIssueDate,
    hasMaterials,
    cutProcessGroupId,
    finishDate,
    setFinishDate,
    savedFinishDate,
    code,
    isNew,
    loading,
    status,
    type,
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
    reloadOrder,
  } = useProductionOrderDetail({ idParam: id });

  const orderId = id && id !== "new" ? Number(id) : null;

  /**
   * Una orden que ya arrancó no se edita: solo se avanza.
   *
   * En cuanto un servicio se movió de su situación inicial hay talleres
   * trabajando contra estos ítems, y cambiar qué se produce dejaría la ruta,
   * la explosión y el avance apuntando a algo que ya no existe. El estado lo
   * calcula el backend a partir de los servicios, así que esto no inventa una
   * regla nueva: lee la que ya hay.
   */
  const locked = !isNew && status !== null && status !== "DRAFT";

  /**
   * Una orden de CONSIGNACIÓN (lote de Overtake) no se produce aquí: es un
   * ingreso ya cerrado. No tiene receta, materiales ni ruta de operaciones que
   * mostrar, y no se edita desde el ERP. Es un bloqueo más fuerte que `locked`:
   * en vez de deshabilitar campos, esconde las secciones que no aplican.
   */
  const isConsignment = type === "CONSIGNMENT";
  /** Solo lectura efectiva del formulario: por estado o por ser consignación. */
  const readOnly = locked || isConsignment;

  // ---- La orden como en la pizarra (multicliente, 2026-10-15) -------------
  const overview = useOrderOverview(
    orderId,
    items,
    reloadKey + overviewKey,
    !isNew && !isConsignment
  );

  /**
   * «Materiales» es el requerimiento que sale de la receta de cada prenda. Sin
   * materiales no hay nada que mostrar y la fila no aparece. Si el backend no
   * lo dice, se deduce del requerimiento ya leído.
   */
  const conMateriales = hasMaterials ?? (overview.materials?.count ?? 0) > 0;

  /** Por qué no se puede recibir, dicho en palabras. null = se puede. */
  const receiveBlockedReason: string | null = !canEditOrder
    ? "No tienes permiso para recibir en esta orden."
    : overview.reception.allClosed
      ? "Ya se recibió todo lo pedido."
      : null;
  // Sin nada terminado para recibir el botón queda apagado. Con ruta se dice
  // por qué (2026-11-11): se recibe lo que entrega el ÚLTIMO proceso, y con
  // la Costura terminada no se entendía que faltara el Acabado. Sin ruta, sin
  // aviso: se entiende solo.
  const receiveDisabled = receiveBlockedReason !== null || overview.reception.ready === 0;
  const ultimoProceso = overview.production?.processes.at(-1)?.name ?? null;
  const receiveHint: string | null =
    receiveBlockedReason === null &&
    overview.reception.ready === 0 &&
    !overview.reception.allClosed &&
    ultimoProceso !== null
      ? `Se recibe lo que entrega ${ultimoProceso}: aún no entrega nada.`
      : null;

  const [savingFinishDate, setSavingFinishDate] = useState(false);

  /**
   * Si la fecha de término se tocó desde que se cargó la orden.
   *
   * Las dos son el texto del input de fecha --«YYYY-MM-DD» o vacío-- así que
   * se comparan directamente. Volver a mano a la fecha original cuenta como
   * no haberla tocado, que es lo que la persona está diciendo al hacerlo.
   */
  const finishDateDirty = finishDate !== savedFinishDate;

  /**
   * Guardar SOLO la fecha de término, con la orden ya lanzada.
   *
   * Vacía la borra: una fecha puesta por error tiene que poder quitarse, y con
   * ella fuera la recepción vuelve a poder ponerla sola.
   */
  const handleSaveFinishDate = async () => {
    if (orderId === null) return;
    try {
      setSavingFinishDate(true);
      await updateProductionOrderFinishDateApi(orderId, finishDate || null);
      toast({ title: "Fecha de término guardada", variant: "success" });
      await reloadOrder();
    } catch (error) {
      toastError(error, "No se pudo guardar la fecha de término");
    } finally {
      setSavingFinishDate(false);
    }
  };

  const bumpReload = () => setReloadKey((prev) => prev + 1);

  /**
   * Los materiales NO salen de la pizarra: esa los carga por su cuenta. Se
   * piden aquí al imprimir, que además garantiza que el papel lleva el
   * requerimiento de este momento y no uno que quedó en pantalla antes de
   * tocar los ítems.
   */
  const handlePrint = async () => {
    if (orderId === null) return;

    try {
      setPrinting(true);
      // La ruta tampoco sale de la pantalla: se pide aquí, en paralelo con lo
      // demás.
      //
      // El requerimiento ya NO se pide: el papel dejó de imprimir los
      // materiales, y era lo único para lo que se leía aquí. Sigue haciendo
      // falta para el Requerimiento de Materiales, que es otro documento.
      const [company, route] = await Promise.all([
        getCompanyDocumentHeader(),
        productionOrderProcessesApi(orderId),
      ]);

      // Categorías y etiquetas cuelgan del producto, así que dos tallas de la
      // misma prenda repiten las suyas: se juntan sin duplicar.
      const distinct = (values: string[]) =>
        [...new Set(values.filter(Boolean))].sort((a, b) =>
          a.localeCompare(b, "es")
        );

      await openProductionOrderPdf({
        orderId,
        name,
        code,
        description: description || null,
        className:
          classes.find((option) => option.id.toString() === classId)?.name ?? "",
        statusLabel: status ? productionOrderStatusBadge(status).label : "",
        createdAt: createdAt ?? new Date().toISOString(),
        promisedDate: promisedDate || null,
        company,
        garments: items.map((item) => ({
          // El label es el respaldo: la rejilla nombra la fila con producto y
          // color, y solo cae a esto cuando la prenda no tiene ni talla.
          label: item.variationLabel ?? item.name,
          sku: item.variationSku,
          quantity: item.quantity,
          // La talla por separado: es la columna de la rejilla.
          productTitle: item.productTitle,
          sizeTermId: item.sizeTermId,
          sizeTerm: item.sizeTerm,
          sizeGroup: item.sizeGroup,
          otherTerms: item.otherTerms,
        })),
        categories: distinct(items.flatMap((item) => item.categories)),
        tags: distinct(items.flatMap((item) => item.tags)),
        processes: route.processes.map((paso) => ({
          order: paso.order,
          processName: paso.processName,
          processGroupName: paso.processGroupName,
          // Solo los que tienen código: un servicio sin él no aporta nada a
          // esta columna y dejaría comas sueltas.
          serviceCodes: paso.steps
            .map((step) => step.serviceCode)
            .filter((code): code is string => Boolean(code)),
          requested: paso.progress.requested,
          advanced: paso.progress.advanced,
          remaining: paso.progress.remaining,
          isComplete: paso.isComplete,
          isBlocked: paso.isBlocked,
        })),
        // Las fotos son del PRODUCTO, así que las cuatro tallas de una prenda
        // repiten las suyas: se juntan sin duplicar, igual que categorías y
        // etiquetas.
        imageUrls: distinct(items.flatMap((item) => item.productImages)),
      });
    } catch (error) {
      toast({
        title: "No se pudo generar la orden: " + errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  };

  /**
   * El requerimiento, en su propio papel.
   *
   * Vivía rotulado en la receta, donde no puede estar: la receta dice lo que
   * consume UNA prenda, y el requerimiento solo existe cuando una orden dice
   * cuántas prendas son. Por eso encabeza con la O. Producción y su código.
   *
   * Se pide en el momento, como la Orden de Producción: el papel lleva el
   * requerimiento de ahora y no uno que quedó en pantalla antes de tocar los
   * ítems.
   */
  const handlePrintRequirement = async () => {
    if (orderId === null) return;

    try {
      setPrintingRequirement(true);
      const [requirement, company] = await Promise.all([
        materialRequirementApi(orderId),
        getCompanyDocumentHeader(),
      ]);

      if (requirement.materials.length === 0) {
        toast({
          title: "Esta orden todavía no tiene materiales",
          description: "Asigna una receta a sus prendas y vuelve a intentarlo.",
          variant: "destructive",
        });
        return;
      }

      // Categorías y códigos de molde cuelgan del producto y de la receta, y
      // dos tallas de la misma prenda repiten los suyos: se juntan sin
      // duplicar, igual que en la Orden de Producción.
      const distinct = (values: (string | null)[]) =>
        [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) =>
          a.localeCompare(b, "es"),
        );

      openMaterialRequirementPdf({
        orderId,
        orderCode: code,
        orderNotes: description || null,
        createdAt: createdAt ?? new Date().toISOString(),
        promisedDate: promisedDate || null,
        requesterName: createdByName,
        categories: distinct(items.flatMap((item) => item.categories)),
        modelCodes: distinct(items.map((item) => item.explosionModelCode)),
        totalGarments: items.reduce((sum, item) => sum + item.quantity, 0),
        company,
        materials: requirement.materials.map((material) => ({
          name: material.materialName,
          className: material.materialClassName,
          measurementUnit: material.measurementUnit,
          required: material.totalRequired,
          stock: material.stock,
          stockAtSuppliers: material.stockAtSuppliers,
          missing: material.missing,
          unitCost: material.unitCost,
          totalCost: material.totalCost,
        })),
        estimatedTotalCost: requirement.estimatedTotalCost,
      });
    } catch (error) {
      toast({
        title: "No se pudo generar el requerimiento: " + errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setPrintingRequirement(false);
    }
  };

  if (loading) {
    return <PageLoader message="Cargando orden de producción..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/suppliers/production-orders")}
          aria-label="Volver a órdenes de producción"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew
              ? "Nueva orden de producción"
              : (code ?? `Orden #${id}`)}
          </h1>
          {/* Mismo cálculo y mismo rótulo que la fila del listado: sale de
              productionOrderStatusBadge. En el alta no se pinta -- todavía no
              hay orden que tenga estado. */}
          {!isNew && status && (
            <Badge variant={productionOrderStatusBadge(status).variant}>
              {productionOrderStatusBadge(status).label}
            </Badge>
          )}
          {/* Origen de la orden (Consignación / Producción). Sale del mismo
              util que la fila del listado; en el alta y en las históricas sin
              type no se pinta. */}
          {!isNew && productionOrderTypeBadge(type) && (
            <Badge variant={productionOrderTypeBadge(type)!.variant}>
              {productionOrderTypeBadge(type)!.label}
            </Badge>
          )}
          {/* Recibir e imprimir, siempre a la vista. En el alta no: una orden
              sin guardar no tiene nada que recibir ni imprimir. En
              consignación tampoco: no hay receta, materiales ni ruta. */}
          {!isNew && !isConsignment && (
            <div className="ml-auto">
              <OrderActionsBar
                onReceive={() => setReceiveOpen(true)}
                receiveBlockedReason={receiveBlockedReason ?? receiveHint}
                receiveDisabled={receiveDisabled}
                onPrintOrder={handlePrint}
                onPrintRequirement={handlePrintRequirement}
                showRequirement={conMateriales}
                printing={printing || printingRequirement}
              />
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label required>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              placeholder="Ej: Producción semana 32"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label required>Clase de orden</Label>
            <Select
              value={classId}
              onValueChange={setClassId}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar clase..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de emisión (T-980): distinta de la pactada y de la de
              término. Nace con la de hoy; no puede ser futura (tope por
              defecto de DateField) ni posterior a la pactada. */}
          <div className="space-y-2">
            <Label htmlFor="order-issue-date" required>
              Fecha de emisión
            </Label>
            <DateField
              id="order-issue-date"
              value={issueDate || null}
              onChange={(value) => setIssueDate(value ?? "")}
              disabled={readOnly}
              placeholder="Elige la fecha de emisión"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-promised-date">Entrega comprometida</Label>
            {/* El mismo selector que los filtros del ERP, en vez del campo de
                fecha del navegador, que cada uno pinta a su manera.

                maxDate null: es una fecha al FUTURO, y el tope de hoy que
                DateField trae por defecto la bloquearía entera. */}
            <DateField
              id="order-promised-date"
              value={promisedDate || null}
              onChange={(value) => setPromisedDate(value ?? "")}
              maxDate={null}
              disabled={readOnly}
              showClear
              placeholder="Sin fecha comprometida"
            />
          </div>

          {/* La fecha de término se edita SIEMPRE, también con la orden ya
              lanzada. Es el único campo así, y es a propósito: las demás son
              del encargo --moverlas con la orden en los talleres descuadra lo
              pedido con lo que se está haciendo-- y esta es del cierre.

              La pone sola la recepción cuando entra la última prenda; esto es
              para corregirla, que es lo que hace falta cuando la mercadería
              llegó un viernes y se registró el lunes. Va en la misma fila que
              las notas (2026-10-20). */}
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order-finish-date">Fecha de término</Label>
              <DateField
                id="order-finish-date"
                value={finishDate || null}
                onChange={(value) => setFinishDate(value ?? "")}
                maxDate={null}
                disabled={isConsignment}
                showClear
                placeholder="Sin fecha de término"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas de la orden</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={readOnly}
                placeholder="Ej: entregar con etiqueta de marca"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Una consignación no lleva receta ni ítems editables: es un ingreso ya
          cerrado. Se esconde el editor entero en vez de deshabilitarlo. */}
      {!isConsignment && (
        <Card>
          <CardContent className="pt-6">
            <ProductionOrderItemsEditor
              items={items}
              explosions={explosions}
              explosionsByVariation={explosionsByVariation}
              search={explosionSearch}
              onSearchChange={setExplosionSearch}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onChangeQuantity={setItemQuantity}
              onSelectExplosion={setItemExplosion}
              onSelectVariation={setItemVariation}
              onSelectVariations={setItemVariations}
              totalQuantity={totalItemsQuantity}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      )}

      {/* La pizarra (multicliente, 2026-10-15): la ruta de la orden con sus
          materiales, cada proceso con su taller y sus encargos, la recepción
          y el costo. Reemplaza las pestañas «Explosión de materiales» y
          «Avances». Una consignación no se produce aquí: no la lleva. */}
      {!isNew && !isConsignment && orderId !== null && (
        <OrderBoardCard
          productionOrderId={orderId}
          orderCode={code}
          canEdit={canEditOrder}
          overview={overview}
          cutProcessGroupId={cutProcessGroupId}
          withMaterials={conMateriales}
          // overviewKey sube al cambiar una situación o el consumo de un
          // encargo: el faltante se ve sin recargar.
          reloadKey={reloadKey + overviewKey}
          onReceive={() => setReceiveOpen(true)}
          receiveDisabled={receiveDisabled}
          receiveHint={receiveHint}
          onChanged={() => setOverviewKey((prev) => prev + 1)}
          // Avanzar o encargar un proceso desde su fila. Silenciosa: sin el
          // «Cargando» que desmonta la página.
          onAdvanced={() => {
            void reloadOrder({ silent: true });
            setOverviewKey((prev) => prev + 1);
          }}
          onCutRegistered={() => void reloadOrder({ silent: true })}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Una consignación es un ingreso de Overtake ya cerrado: no se edita
            desde el ERP. La orden ya lanzada no lleva aviso: que no se editen
            las prendas se ve en los propios campos. */}
        {isConsignment && (
          <p className="text-muted-foreground mr-auto text-sm">
            Esta orden es una consignación recibida de Overtake. Se muestra solo
            de lectura: no lleva receta, materiales ni ruta de operaciones.
          </p>
        )}
        {/* «Cancelar» solo mientras hay cambios que descartar. Con la orden
            lanzada --o en una consignación de solo lectura-- no los hay, y un
            «Volver» aquí repetiría la flecha del título. */}
        {!readOnly && (
          <Button
            variant="outline"
            onClick={() => navigate("/suppliers/production-orders")}
          >
            Cancelar
          </Button>
        )}
        {/* Con la orden lanzada, lo único editable es la fecha de término, así
            que su guardado es suyo: manda solo esa fecha. El botón de abajo
            mandaría el formulario entero y pasaría por
            fn_replace_production_order_items, que rehace las prendas y su
            stock, para cambiar una fecha.

            Y solo sale si la fecha cambió: sin cambios no hay nada que
            guardar. Al guardar, reloadOrder vuelve a sembrar las dos y el
            botón se va solo. */}
        {locked && !isConsignment && finishDateDirty && (
          <Button
            onClick={handleSaveFinishDate}
            disabled={savingFinishDate}
            variant="outline"
          >
            {savingFinishDate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar fecha de término"
            )}
          </Button>
        )}

        {/* Sin botón de guardar no hay forma de mandar el cambio: los campos
            deshabilitados ya lo impiden, pero dejarlo ahí invitaría a
            pulsarlo. En consignación tampoco: es de solo lectura. */}
        {!readOnly && (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isNew ? (
              "Guardar Orden"
            ) : (
              "Guardar cambios"
            )}
          </Button>
        )}
      </div>

      {/* Recibir desde la cabecera o la pizarra: todas las prendas de la
          orden, con «cerrar ingreso» por prenda. */}
      {receiveOpen && orderId !== null && (
        <ReceiveProductionOrderDialog
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          productionOrderId={orderId}
          productionOrderLabel={code ?? name}
          items={items}
          onReceived={async () => {
            await reloadOrder({ silent: true });
            bumpReload();
          }}
        />
      )}
    </div>
  );
};

export default ProductionOrderDetail;
