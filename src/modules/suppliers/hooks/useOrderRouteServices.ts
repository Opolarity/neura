import { useEffect, useState } from "react";
import { productionPlanApi } from "../services/productionPlan.service";
import { ProductionPlanRouteStep } from "../types/productionPlan.types";
import { diasDeAtraso, tallerCorto } from "../utils/routeServiceSchedule";

/** Quién tiene un proceso de la ruta y cuándo, como en «Avance por talla». */
export interface RouteStepSchedule {
  /** El taller en corto; null si el paso aún no tiene encargo. */
  taller: string | null;
  supplierName: string | null;
  /** Lo pactado con el taller y cuándo terminó de verdad (YYYY-MM-DD). */
  pactada: string | null;
  fin: string | null;
  /** Días de atraso de un proceso abierto; 0 si va a tiempo. */
  atraso: number;
}

/**
 * El taller y las fechas de cada proceso de una orden, por `processGroupId`.
 *
 * Sale de la misma ruta que pinta la rejilla de avance (get-production-plan),
 * con su regla: con varios servicios en el paso manda el primero. Si no carga,
 * la pizarra sigue sin estos datos en vez de fallar.
 */
export const useOrderRouteServices = (productionOrderId: number | null, reloadKey: number) => {
  const [schedule, setSchedule] = useState<Map<number, RouteStepSchedule>>(new Map());
  /**
   * Los pasos de la ruta, con sus encargos: de aquí
   * salen los pop-ups de avance de cada fila de la pizarra (2026-10-19).
   */
  const [steps, setSteps] = useState<ProductionPlanRouteStep[]>([]);

  useEffect(() => {
    if (productionOrderId === null) return;
    let vigente = true;
    productionPlanApi({ production_order_id: productionOrderId, page: 1, size: 1 })
      .then((response) => {
        if (!vigente) return;
        const mapa = new Map<number, RouteStepSchedule>();
        const ruta = response.routes[productionOrderId] ?? [];
        setSteps(ruta);
        for (const step of ruta) {
          if (step.processGroupId === null || mapa.has(step.processGroupId)) continue;
          const servicio = step.services[0] ?? null;
          mapa.set(step.processGroupId, {
            taller: tallerCorto(servicio?.supplierName),
            supplierName: servicio?.supplierName ?? null,
            pactada: servicio?.promisedDate ?? null,
            fin: servicio?.endDate ?? null,
            atraso: diasDeAtraso(servicio?.promisedDate ?? null, step.isComplete),
          });
        }
        setSchedule(mapa);
      })
      .catch(() => {
        if (!vigente) return;
        setSchedule(new Map());
        setSteps([]);
      });
    return () => {
      vigente = false;
    };
  }, [productionOrderId, reloadKey]);

  return { schedule, steps };
};
