import { openRemisionGuidePdf } from "@/shared/utils/remisionGuidePdf";
import { ServiceProgressTarget } from "../hooks/useServiceProgress";

/**
 * Serie de las guías de producción.
 *
 * Distinta de la `T001` de ventas a propósito: el correlativo de las dos es un
 * id de la base, así que compartir serie haría que la guía del servicio 123 y
 * la del pedido 123 salieran con el mismo número.
 */
const SERIE = "P001";

/**
 * El número de la guía de un servicio.
 *
 * El correlativo es el id del servicio, así que el número se DERIVA y no se
 * guarda: la misma pierna del recorrido —lo que sale hacia un taller y lo que
 * vuelve de él— lleva siempre el mismo papel, y se puede nombrar sin haberlo
 * impreso todavía.
 *
 * Se exporta porque el detalle de un proceso del Plan Maestro lo usa para
 * contar de dónde viene y a dónde va la prenda. Escribir el formato en dos
 * sitios era la forma segura de que un día dejaran de coincidir.
 */
export const productionGuideNumber = (serviceId: number): string =>
  `${SERIE}-${String(serviceId).padStart(8, "0")}`;

/**
 * Por qué sale la mercadería hacia el taller.
 *
 * No es una venta: las prendas salen para que les hagan un proceso y vuelven.
 */
const MOTIVO = "Traslado para transformación";

/**
 * De dónde viene y a dónde va el bulto.
 *
 * Todo opcional: los diálogos de avance solo conocen el servicio, y con eso ya
 * sale una guía correcta. El detalle de un proceso del Plan Maestro sí sabe el
 * recorrido entero, y ahí la guía puede decir de qué proceso a qué proceso
 * viaja la prenda -- que es lo que se comprueba al recibirla.
 */
export interface ProductionGuideContext {
  /** La orden de producción, con su código. */
  orderCode?: string | null;
  /** El proceso al que va la mercadería. */
  processName?: string | null;
  /** De dónde sale. Sin esto se asume que sale del almacén de la empresa. */
  origin?: {
    processName: string;
    supplierName: string | null;
    address: string | null;
  } | null;
  /** Cuándo se manda, en ISO. Por defecto, hoy. */
  sentAt?: string | null;
}

/** Lo que se manda de una prenda en este envío. */
export interface ProductionGuideLine {
  /** El servicio que cubre esa prenda: de él sale el proveedor. */
  service: ServiceProgressTarget;
  /** La prenda, cuando el servicio cubre varias. */
  itemId?: number | null;
  /** Lo que se manda, tal como se declaró en el avance. */
  quantity: number;
}

/**
 * La guía de remisión de un avance de producción.
 *
 * Un envío, un papel: todas las prendas que van al mismo proceso viajan juntas
 * al mismo taller, así que salen en una sola guía. El destinatario es el
 * proveedor del servicio; si son varios servicios, todos son del mismo proceso
 * y por tanto del mismo proveedor, así que basta con el primero.
 *
 * Se imprime lo que se sabe. Un proveedor sin dirección cargada deja el rótulo
 * de llegada vacío en vez de inventarlo, que es la misma regla que sigue
 * `productionOrderPdf.ts`.
 */
export async function openProductionRemisionGuide(
  lines: ProductionGuideLine[],
  context: ProductionGuideContext = {},
): Promise<void> {
  const conCantidad = lines.filter((line) => line.quantity > 0);
  if (conCantidad.length === 0) return;

  const primero = conCantidad[0].service;
  const origen = context.origin ?? null;

  // Qué se manda, a quién y desde dónde. Va aparte del destinatario porque el
  // destinatario responde «a qué dirección llega» y esto responde «qué trabajo
  // es»: sin ello, dos guías al mismo taller en la misma semana son el mismo
  // papel dos veces y no se sabe cuál corresponde a qué proceso.
  const servicio = [
    { label: "Orden de producción", value: context.orderCode ?? "" },
    { label: "Proceso destino", value: context.processName ?? "" },
    {
      label: "Servicio",
      value: [primero.code, primero.description].filter(Boolean).join(" · "),
    },
    { label: "Lo realiza", value: primero.supplierName ?? "" },
    {
      label: "Viene de",
      value: origen
        ? [origen.processName, origen.supplierName].filter(Boolean).join(" · ")
        : "Almacén",
    },
    {
      label: "Fecha de envío",
      value: new Date(context.sentAt ?? Date.now()).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    },
  ].filter((field) => Boolean(field.value));

  await openRemisionGuidePdf({
    guideNumber: productionGuideNumber(primero.id),
    issueDate: context.sentAt ?? undefined,
    // Quien despacha no siempre es la empresa: cuando la prenda pasa de un
    // taller al siguiente, quien entrega es el taller anterior.
    originName: origen
      ? (origen.supplierName ?? origen.processName)
      : undefined,
    originAddress: origen?.address ?? undefined,
    extraSection: { title: "Servicio", fields: servicio },
    recipientName: primero.supplierName ?? primero.description,
    // Un taller factura, así que casi siempre es RUC. Se imprime el que tenga
    // registrado, no uno supuesto.
    documentType: primero.supplierDocumentType ?? "",
    documentNumber: primero.supplierDocumentNumber ?? "",
    destinationAddress: primero.supplierAddress ?? "",
    transferReason: MOTIVO,
    items: conCantidad.map((line) => {
      const prenda =
        line.itemId != null
          ? line.service.items.find((item) => item.id === line.itemId)
          : line.service.items[0];
      return {
        sku: prenda?.sku ?? "",
        // El nombre ya viene compuesto como producto y variación; la guía lo
        // parte en producto y variación otra vez, así que se le da entero
        // como producto y la variación vacía.
        productName: prenda?.name ?? line.service.description,
        variationName: "",
        quantity: line.quantity,
        // La unidad del servicio: un material va en metros o kilos, no en
        // unidades.
        unit:
          line.service.materialMeasurementUnit ??
          line.service.measurementUnit ??
          undefined,
      };
    }),
  });
}
