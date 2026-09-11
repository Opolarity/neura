// T-596 · Stock mínimo por variación para canales externos.
//
// Va por edge functions (no por PostgREST) para que la expansión y la
// validación ocurran en el servidor: quién puede escribir qué no puede quedar
// en manos de lo que mande el navegador.
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import type {
  VariationsMinStockApiResponse,
  VariationsMinStockFilters,
  TermOption,
} from "../types/MinimumStock.types";
import { WHOLESALE_CHANNEL_CODE } from "../types/MinimumStock.types";

export const getVariationsMinStockApi = async (
  filters: VariationsMinStockFilters = {},
): Promise<VariationsMinStockApiResponse> => {
  // La edge function espera term_id / tag_id / brand_id; se renombran acá y se
  // quitan los originales para no mandarlos duplicados en la query.
  const { term, tag, brand, ...rest } = filters;

  const endpoint = buildEndpoint("get-variations-min-stock", {
    ...rest,
    term_id: term ?? null,
    tag_id: tag ?? null,
    brand_id: brand ?? null,
  });

  const data = await invokeFunction<VariationsMinStockApiResponse>(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      page: { p_page: 1, p_size: 20, total: 0 },
      default_min_stock: null,
      data: [],
    }
  );
};

export interface SaveMassiveMinStockResult {
  upserted: number;
  cleared: number;
  variations: number;
  channelId: number;
  minStock: number | null;
}

/**
 * Guarda el mínimo de las variaciones seleccionadas.
 *
 * `minStock = null` es "volver al valor por defecto": borra las filas y esas
 * variaciones pasan a regirse por el parámetro global. Distinto de guardar 0,
 * que es decidir explícitamente que esa variación no se protege.
 */
export const saveMassiveMinStockApi = async (
  variationIds: number[],
  channelId: number,
  minStock: number | null,
): Promise<SaveMassiveMinStockResult> => {
  const data = await invokeFunction("assign-massive-min-stock", {
    body: { variationIds, channelId, minStock },
  });

  return data.data as SaveMassiveMinStockResult;
};

/** Canal externo que se configura hoy. Se resuelve por código, nunca por id. */
export const getWholesaleChannelApi = async (): Promise<{
  id: number;
  name: string;
} | null> => {
  const { data, error } = await supabase
    .from("channels")
    .select("id, name")
    .eq("code", WHOLESALE_CHANNEL_CODE)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

/**
 * Catálogo de atributos para el filtro por talla. Reusa get-terms (el mismo
 * endpoint de Productos > Atributos) y aplana grupos + términos, conservando el
 * nombre del grupo: "S" existe en Talla y en Talla boxers, y son términos
 * distintos.
 */
export const getTermOptionsApi = async (): Promise<TermOption[]> => {
  const endpoint = buildEndpoint("get-terms", { page: 1, size: 200 });

  const data = await invokeFunction(endpoint, { method: "GET" });

  const groups = (data?.data ?? []) as {
    group_name: string;
    terms: { id: number; name: string }[];
  }[];

  return groups.flatMap((group) =>
    (group.terms ?? []).map((term) => ({
      id: term.id,
      name: term.name,
      groupName: group.group_name,
    })),
  );
};
