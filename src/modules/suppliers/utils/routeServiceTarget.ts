import { ServiceProgressTarget } from "../hooks/useServiceProgress";
import { ProductionPlanRouteService } from "../types/productionPlan.types";
import { itemDisplayName } from "./productionItemDisplay";

/**
 * El servicio de la ruta y el que pide el diálogo nombran lo mismo de
 * distinta forma. Traducirlo aquí es más barato que renombrar el modelo.
 */
export const toServiceProgressTarget = (
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
  sizes: service.sizes,
  itemIncoming: service.itemIncoming,
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
