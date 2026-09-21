import { openRemisionGuidePdf } from "@/shared/utils/remisionGuidePdf";
import type { MaterialDispatchGuide } from "../types/materialDispatch.types";

/**
 * Por qué sale el material hacia el taller.
 *
 * No es una venta: la tela sale para que le hagan un proceso y vuelve hecha
 * prenda. Es el mismo motivo que la guía de las prendas.
 */
const MOTIVO = "Traslado para transformación";

/**
 * La guía de remisión de un envío de material.
 *
 * El mismo papel que ventas y producción --`shared/utils/remisionGuidePdf`--
 * con lo que cambia entre ellos: qué se manda, a qué cotización y a qué
 * almacén del taller. El número (M001-…) y todas las líneas del envío vienen
 * armados del backend, así que reimprimirla da siempre el mismo papel.
 */
export async function openMaterialRemisionGuide(
  guide: MaterialDispatchGuide
): Promise<void> {
  const envio = [
    { label: "Orden de producción", value: guide.orderCode ?? guide.orderName ?? "" },
    {
      label: "Cotización",
      value: [guide.quotationCode, guide.quotationDescription].filter(Boolean).join(" · "),
    },
    // Solo cuando el envío fue para un servicio concreto: sin él, es para
    // todos los de la cotización y no hay nada que decir.
    { label: "Servicio", value: guide.serviceLabel ?? "" },
    { label: "Lo realiza", value: guide.supplierName ?? "" },
    { label: "Almacén de destino", value: guide.destinationWarehouse?.name ?? "" },
    { label: "Sale de", value: guide.originWarehouse?.name ?? "" },
    { label: "Despachado por", value: guide.userName ?? "" },
    {
      label: "Fecha de envío",
      value: guide.sentAt
        ? new Date(guide.sentAt).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "",
    },
  ].filter((field) => Boolean(field.value));

  await openRemisionGuidePdf({
    guideNumber: guide.guideNumber,
    issueDate: guide.sentAt || undefined,
    // Sale de nuestro almacén: si tiene dirección propia, es la de partida.
    originAddress: guide.originWarehouse?.address ?? undefined,
    extraSection: { title: "Envío de material", fields: envio },
    recipientName: guide.supplierName ?? "",
    documentType: guide.supplierDocumentType ?? "",
    documentNumber: guide.supplierDocumentNumber ?? "",
    // Llega al almacén del taller; si no tiene dirección, la del proveedor.
    destinationAddress:
      guide.destinationWarehouse?.address || guide.supplierAddress || "",
    transferReason: MOTIVO,
    items: guide.items.map((item) => ({
      sku: "",
      productName: item.materialName,
      variationName: item.materialClass ?? "",
      quantity: item.quantity,
      // Un material va en metros o kilos, no en unidades.
      unit: item.measurementUnit ?? undefined,
    })),
  });
}
