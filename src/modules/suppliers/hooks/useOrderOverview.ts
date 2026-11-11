import { useEffect, useMemo, useState } from "react";
import { materialRequirementApi } from "../services/materialRequirement.service";
import { productionOrderProcessesApi } from "../services/productionOrderProcesses.service";
import { ProductionOrderItem } from "../types/productionOrders.types";
import { ProcessGroupState } from "../types/productionOrderProcesses.types";

/** Un proceso de la ruta, resumido para la barra de etapas. */
export interface OverviewProcess {
  /** El proceso (Corte, Costura...) del catálogo; null en pasos sueltos. */
  processGroupId: number | null;
  name: string;
  /** Los encargos a talleres que lo cubren (OS-0041...). */
  serviceCodes: string[];
  advanced: number;
  requested: number;
  complete: boolean;
}

/**
 * La orden resumida en sus cuatro etapas: qué se produce, con qué, por dónde
 * va y cuánto ya entró.
 *
 * Todo sale de lo que la pantalla ya pide -- las prendas del detalle, el
 * requerimiento de materiales y la ruta con su avance --, no de un cálculo
 * nuevo: la barra no puede decir algo distinto que las pestañas de debajo.
 */
export interface OrderOverview {
  garments: {
    total: number;
    sizes: number;
    withoutProduct: number;
    withoutRecipe: number;
  };
  /** null mientras carga. */
  materials: { count: number; missing: number } | null;
  /** null mientras carga. */
  production: { processes: OverviewProcess[]; allDone: boolean } | null;
  reception: {
    ordered: number;
    received: number;
    /**
     * Terminado en el último paso y aún sin recibir, sin contar las prendas
     * con el ingreso ya cerrado («ya no entra más»).
     */
    ready: number;
    /** Ninguna prenda admite más ingreso: cerrada a mano o recibida completa. */
    allClosed: boolean;
  };
}

const nombreDe = (p: ProcessGroupState) =>
  p.processGroupName ?? p.processName ?? `Paso ${p.order}`;

export const useOrderOverview = (
  orderId: number | null,
  items: ProductionOrderItem[],
  reloadKey: number,
  enabled: boolean
) => {
  const [materials, setMaterials] = useState<OrderOverview["materials"]>(null);
  const [production, setProduction] = useState<OrderOverview["production"]>(null);

  useEffect(() => {
    if (!enabled || orderId === null) return;
    let vigente = true;
    setMaterials(null);
    setProduction(null);

    materialRequirementApi(orderId)
      .then((req) => {
        if (!vigente) return;
        setMaterials({
          count: req.materials.length,
          missing: req.materials.filter((m) => m.missing > 0).length,
        });
      })
      // Sin el resumen la pantalla sigue sirviendo: la etapa dice que no pudo
      // calcularlo en vez de tumbar la orden.
      .catch(() => vigente && setMaterials({ count: 0, missing: 0 }));

    productionOrderProcessesApi(orderId)
      .then((data) => {
        if (!vigente) return;
        const processes = [...data.processes]
          .sort((a, b) => a.order - b.order)
          .map((p) => ({
            processGroupId: p.processGroupId,
            name: nombreDe(p),
            serviceCodes: [
              ...new Set(p.steps.map((step) => step.serviceCode).filter((c): c is string => Boolean(c))),
            ],
            advanced: p.progress.advanced,
            requested: p.progress.requested,
            complete: p.isComplete,
          }));
        setProduction({
          processes,
          allDone: processes.length > 0 && processes.every((p) => p.complete),
        });
      })
      .catch(() => vigente && setProduction({ processes: [], allDone: false }));

    return () => {
      vigente = false;
    };
  }, [orderId, reloadKey, enabled]);

  const overview = useMemo<OrderOverview>(() => {
    // Sin producto no hay a qué variación ingresar: no suma a lo que hay
    // listo para recibir.
    const conProducto = items.filter((item) => item.variationId !== null);
    const total = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    // Lo que ya entró a stock, como lo suma el backend de los movimientos.
    const received = items.reduce((sum, item) => sum + (item.received || 0), 0);
    // Listo para recibir: lo que entrega el último proceso y aún no entró. Una
    // prenda con el ingreso cerrado a mano ya no recibe nada más.
    const ready = conProducto
      .filter((item) => !item.intakeClosed)
      .reduce((sum, item) => sum + Math.max(0, (item.routeOutput ?? 0) - (item.received || 0)), 0);
    // Cerrada a mano o recibida entera: esa prenda ya no admite más ingreso.
    const allClosed =
      items.length > 0 &&
      items.every((item) => item.intakeClosed || (item.received || 0) >= (item.quantity || 0));

    return {
      garments: {
        total,
        sizes: items.length,
        withoutProduct: items.length - conProducto.length,
        withoutRecipe: items.filter((item) => item.explosionId === null).length,
      },
      materials,
      production,
      reception: {
        ordered: total,
        received,
        ready,
        allClosed,
      },
    };
  }, [items, materials, production]);

  return overview;
};
