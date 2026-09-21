import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  toExplosion,
  toExplosionDetail,
} from "../adapters/explosions.adapter";
import {
  Explosion,
  ExplosionDetail,
  ExplosionsFilters,
  SaveExplosionData,
} from "../types/explosions.types";

interface ExplosionsListResponse {
  data: Explosion[];
  pagination: PaginationState;
}

export const explosionsListApi = async (
  filters: ExplosionsFilters
): Promise<ExplosionsListResponse> => {
  const {
    page = 1,
    size = 20,
    search,
    variation_id,
    product_id,
    category_id,
    without_variation,
  } = filters;

  const endpoint = buildEndpoint("get-explosions", {
    page,
    size,
    search,
    variation_id,
    product_id,
    category_id,
    without_variation,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.explosionsdata ?? { data: [], page: { page, size, total: 0 } };

  return {
    data: (raw.data ?? []).map(toExplosion),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

export const explosionByIdApi = async (id: number): Promise<ExplosionDetail> => {
  const endpoint = buildEndpoint("get-explosion-by-id", { id });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return toExplosionDetail(data?.explosion ?? {});
};

/**
 * Crea la explosión y devuelve su id.
 *
 * El id hace falta para el alta desde la orden de producción, que la asigna
 * al ítem en cuanto se crea sin pasar por el listado. Llega en `data.id`
 * porque `sp_create_explosion` devuelve `{id, total}`.
 */
/**
 * `invokeFunction` y no `functions.invoke` a secas.
 *
 * Con la llamada cruda, un error de la function llega como un
 * `FunctionsHttpError` cuyo `.message` es siempre «Edge Function returned a
 * non-2xx status code»: el mensaje real viaja en el cuerpo y hay que sacarlo.
 * Aquí eso ya no es un detalle estético — desde que el código de modelo es
 * único, el SP contesta qué receta lo está usando, y ese es justo el texto que
 * el usuario necesita leer para arreglarlo.
 */
export const createExplosionApi = async (
  payload: SaveExplosionData
): Promise<number | null> => {
  const data = await invokeFunction("create-explosion", {
    method: "POST",
    body: payload,
  });

  const id = data?.data?.id;
  return id === undefined || id === null ? null : Number(id);
};

export const updateExplosionApi = async (
  payload: SaveExplosionData
): Promise<void> => {
  await invokeFunction("update-explosion", {
    method: "POST",
    body: payload,
  });
};
