import { useEffect, useMemo, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import {
  allQuotationServicesApi,
  fetchSituationsByModuleId,
} from "@/modules/quotations/services/Quotations.service";
import { openServiceOrderPdf } from "@/modules/quotations/utils/serviceOrderPdf";
import { useProductionOrderServices } from "./useProductionOrderServices";
import { ServiceProcesses } from "../types/productionOrderProcesses.types";

/** Una cotización de la orden: el taller, lo que se le encarga y su papel. */
export interface EncargoRow {
  /** Null mientras el backend no la devuelva: entonces la fila es el taller. */
  quotationId: number | null;
  quotationCode: string | null;
  quotationDescription: string;
  /** Las notas de la cotización: Observaciones del papel. */
  quotationNotes: string | null;
  /** Moneda pactada (ISO) y condición de pago: las imprime el papel. */
  currency: string | null;
  paymentTerms: string | null;
  supplierId: number | null;
  supplierName: string;
  createdAt: string | null;
  /** Los procesos que cubren sus servicios, sin repetir. */
  processes: string;
  services: ServiceProcesses[];
  total: number;
}

/**
 * Con qué se identifica una fila: su cotización, o su taller cuando el backend
 * todavía no devuelve la cotización.
 */
export const claveDe = (encargo: {
  quotationId: number | null;
  supplierId: number | null;
  services: ServiceProcesses[];
}): string =>
  encargo.quotationId !== null
    ? `q${encargo.quotationId}`
    : `s${encargo.supplierId ?? encargo.services[0]?.supplierServiceId}`;

/** Si el encargo cubre el proceso (Corte, Costura...) de la ruta. */
export const cubreProceso = (encargo: EncargoRow, processGroupId: number): boolean =>
  encargo.services.some((service) => service.steps.some((step) => step.processGroupId === processGroupId));

/**
 * Los encargos de taller de una orden, con su papel (2026-11-11: sacado de
 * ProductionOrderServices para pintarlos también en cada fila de la Ruta).
 *
 * Es el espejo de «Compras de esta orden» en la explosión, y se agrupa igual:
 * **un encargo es una cotización**, que en este modelo es un proveedor —
 * `supplier_service_quotations` tiene un solo `supplier_id`—.
 *
 * No uno por servicio. Lo que se le encarga a un taller es el conjunto —
 * cortar, coser, estampar—, así que la Orden de Servicio sale **una por
 * cotización con todas sus líneas**: un papel por servicio obligaría a mandarle
 * tres documentos para un mismo encargo y ninguno diría cuánto suma.
 *
 * Las líneas del papel NO se toman de aquí: se piden completas al imprimir,
 * como hace el botón de Cotizaciones. Aquí solo están los servicios que
 * entraron a ESTA orden, y una orden de servicio que imprimiera un subconjunto
 * se contradiría con la cotización que el proveedor tiene.
 */
export const useServiceOrders = (
  productionOrderId: number | null,
  productionOrderCode: string | null,
  reloadKey: number,
) => {
  const { services, items, loading } = useProductionOrderServices(productionOrderId, reloadKey);

  /** Qué cotización se está imprimiendo: el spinner es de su fila. */
  const [imprimiendo, setImprimiendo] = useState<string | null>(null);

  /**
   * La situación «En cotización»: mientras un servicio está así su precio se
   * cambia desde «Precios». Se lee una vez, del módulo de los servicios.
   */
  const [enCotizacionId, setEnCotizacionId] = useState<number | null>(null);
  const moduloServicios = services[0]?.moduleId ?? null;
  useEffect(() => {
    if (moduloServicios === null) return;
    let vigente = true;
    fetchSituationsByModuleId(moduloServicios)
      .then((lista) => {
        if (vigente) setEnCotizacionId(lista.find((s) => s.code === "INQUO-HDN")?.id ?? null);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [moduloServicios]);

  const encargos = useMemo<EncargoRow[]>(() => {
    const porCotizacion = new Map<string, EncargoRow>();

    for (const service of services) {
      // Sin cotización se agrupa por PROVEEDOR, que es lo mismo salvo en el
      // nombre: una cotización tiene un solo `supplier_id`, así que dos
      // servicios del mismo taller en esta orden son el mismo encargo.
      //
      // Existe porque el id de la cotización lo trae una versión reciente del
      // backend, y sin este camino la lista entera desaparecía en cuanto
      // faltaba: un dato ausente puede degradar la fila, nunca borrar el
      // bloque. El proveedor sí está desde siempre.
      const clave =
        service.supplierQuotationId !== null
          ? `q${service.supplierQuotationId}`
          : `s${service.supplierId ?? service.supplierServiceId}`;

      const actual = porCotizacion.get(clave);
      if (actual) {
        actual.services.push(service);
        actual.total += service.price ?? 0;
      } else {
        porCotizacion.set(clave, {
          quotationId: service.supplierQuotationId,
          quotationCode: service.quotationCode,
          quotationDescription: service.quotationDescription,
          quotationNotes: service.quotationNotes,
          currency: service.currency,
          paymentTerms: service.paymentTerms,
          supplierId: service.supplierId,
          supplierName: service.supplierName ?? "—",
          createdAt: service.quotationCreatedAt,
          processes: "",
          services: [service],
          total: service.price ?? 0,
        });
      }
    }

    // Los procesos (Corte, Costura), al final y sobre el grupo ya armado: son
    // los de todos sus servicios juntos, sin repetir. Es el proceso y no la
    // operación, que es opcional y casi siempre va vacía.
    return [...porCotizacion.values()].map((encargo) => ({
      ...encargo,
      processes: [
        ...new Set(
          encargo.services
            .flatMap((service) => service.steps.map((step) => step.processGroupName ?? step.processName))
            .filter((name): name is string => !!name),
        ),
      ].join(", "),
    }));
  }, [services]);

  const print = async (encargo: EncargoRow) => {
    try {
      setImprimiendo(claveDe(encargo));

      // Las líneas completas de la cotización, no las de esta orden: el papel
      // tiene que coincidir con lo que el proveedor tiene cotizado.
      //
      // Sin id de cotización no hay a qué pedírselas, así que se cae a los
      // servicios que esta orden ya tiene de ese taller. El papel sale más
      // corto —le faltarían las líneas de otras órdenes, si las hubiera— pero
      // sale, que es mejor que un botón que no hace nada.
      const [company, lines] = await Promise.all([
        getCompanyDocumentHeader(),
        encargo.quotationId === null
          ? Promise.resolve(null)
          : allQuotationServicesApi(encargo.quotationId, "SERVICE"),
      ]);

      /**
       * Las prendas que cubren sus servicios en ESTA orden.
       *
       * Salen de la matriz paso × prenda. Que algún servicio no tenga
       * atribución explícita significa **todas**, que es lo que ya asume el
       * resto de la ruta.
       */
      const cubreTodo = encargo.services.some((service) =>
        service.steps.some((step) => step.productionOrderItemIds.length === 0),
      );
      const ids = new Set(
        encargo.services.flatMap((service) => service.steps.flatMap((step) => step.productionOrderItemIds)),
      );
      const prendas = cubreTodo ? items : items.filter((item) => ids.has(item.id));

      openServiceOrderPdf({
        quotationCode: encargo.quotationCode,
        processName: encargo.processes || null,
        quotationDescription: encargo.quotationDescription,
        quotationNotes: encargo.quotationNotes,
        currency: encargo.currency,
        paymentTerms: encargo.paymentTerms,
        // La de la cotizacion, no la de hoy: es la que imprime tambien
        // QuotationDetail para este mismo papel.
        createdAt: encargo.createdAt ?? new Date().toISOString(),
        promisedDate: null,
        supplierName: encargo.supplierName,
        supplierDocument: encargo.services[0]?.supplierDocumentNumber ?? null,
        supplierPhone: encargo.services[0]?.supplierPhone ?? null,
        company,
        productionOrderNames: productionOrderCode ? [productionOrderCode] : [],
        // Lo PEDIDO en las dos ramas, no lo último registrado: tras un avance
        // ya no es lo que se encargó.
        lines:
          lines === null
            ? encargo.services.map((service) => ({
                code: service.serviceCode,
                description: service.serviceDescription,
                quantity: service.requestedQuantity,
                measurementUnit: service.measurementUnit,
                price: service.price,
                // Sin declarar: sp_get_production_order_processes no devuelve
                // price_includes_tax, asi que por esta via el papel sale sin
                // desglose. Es la rama de respaldo --sin id de cotizacion-- y
                // se arregla exponiendolo en ese lector.
                includesTax: null,
              }))
            : lines.map((line) => ({
                code: line.code,
                description: line.description,
                quantity: line.requested_quantity,
                measurementUnit: line.last_situation?.measurement_unit ?? null,
                price: line.last_situation?.price ?? null,
                includesTax: line.price_includes_tax ?? null,
              })),
        garments: prendas.map((item) => ({
          label: item.name,
          sku: item.sku,
          quantity: item.quantity,
          // La talla por separado: la rejilla del papel la pone en columna.
          productTitle: item.productTitle,
          sizeTermId: item.sizeTermId,
          sizeTerm: item.sizeTerm,
          sizeGroup: item.sizeGroup,
          otherTerms: item.otherTerms,
        })),
      });
    } catch (error) {
      toastError(error, "No se pudo generar la orden de servicio");
    } finally {
      setImprimiendo(null);
    }
  };

  return { encargos, loading, enCotizacionId, imprimiendo, print };
};
