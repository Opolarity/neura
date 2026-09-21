import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type {
  QuotationConsumptions,
  QuotationConsumptionMaterial,
} from "../types/quotationConsumptions.types";

/**
 * El consumo de material de un paso.
 *
 * Dos llamadas y nada más: leer los candidatos y guardar el conjunto entero. No
 * hay alta ni baja por material a propósito —la pantalla es una lista de
 * casillas y lo que manda es el estado final—; con alta/baja habría que
 * diffear aquí, y dos usuarios a la vez dejarían la lista a medias.
 */

/** Lo que devuelve `sp_get_quotation_consumptions`, en crudo. */
interface QuotationConsumptionsApi {
  quotation_id: number;
  warehouse_id: number | null;
  supplier_name: string | null;
  warehouses: Array<{ id: number; name: string }>;
  materials: Array<{
    material_id: number;
    name: string | null;
    measurement_unit: string | null;
    required: number | string | null;
    consumed_here: boolean;
  }>;
}

/** Del payload del SP al modelo de la UI. */
const adaptar = (data: QuotationConsumptionsApi): QuotationConsumptions => ({
  quotationId: Number(data?.quotation_id),
  supplierName: data?.supplier_name ?? null,
  warehouses: (data?.warehouses ?? []).map((w) => ({
    id: Number(w.id),
    name: w.name ?? "",
  })),
  warehouseId:
    data?.warehouse_id === null || data?.warehouse_id === undefined
      ? null
      : Number(data.warehouse_id),
  materials: (data?.materials ?? []).map(
    (m): QuotationConsumptionMaterial => ({
      materialId: Number(m.material_id),
      name: m.name ?? "",
      measurementUnit: m.measurement_unit ?? null,
      required: Number(m.required ?? 0),
      consumedHere: m.consumed_here === true,
    }),
  ),
});

export const fetchQuotationConsumptionsApi = async (
  quotationId: number,
): Promise<QuotationConsumptions> => {
  const data = await invokeFunction(
    `get-quotation-consumptions?quotation_id=${quotationId}`,
    { method: "GET" },
  );
  return adaptar(data as QuotationConsumptionsApi);
};

export interface SaveQuotationConsumptionsParams {
  quotationId: number;
  /** El estado final. Vacío es válido: «este paso no consume nada». */
  materialIds: number[];
  /** Omitido o null, el backend no toca el almacén que ya hubiera. */
  warehouseId?: number | null;
}

export const saveQuotationConsumptionsApi = async (
  params: SaveQuotationConsumptionsParams,
): Promise<void> => {
  await invokeFunction("set-quotation-consumptions", {
    method: "POST",
    body: {
      quotation_id: params.quotationId,
      material_ids: params.materialIds,
      warehouse_id: params.warehouseId ?? null,
    },
  });
};
