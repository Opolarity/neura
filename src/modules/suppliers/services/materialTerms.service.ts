import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { toMaterialTermGroup } from "../adapters/materialTerms.adapter";
import {
  MaterialTermGroup,
  MaterialTermGroupApi,
  SaveMaterialTermGroupData,
  SaveMaterialTermData,
} from "../types/materialTerms.types";

/**
 * El catálogo entero: los atributos de material son pocos (Color, Largo,
 * Talla…) y la pantalla pagina sobre ellos en el cliente, como las clases.
 */
export const materialTermsApi = async (
  search?: string,
): Promise<MaterialTermGroup[]> => {
  const endpoint = buildEndpoint("get-material-terms", { search });
  const response = await invokeFunction<{ data?: MaterialTermGroupApi[] }>(endpoint, {
    method: "GET",
  });
  return (response?.data ?? []).map(toMaterialTermGroup);
};

// `invokeFunction` para que llegue el mensaje real del SP ("Ya hay un atributo
// de material con el código COLOR"), no el genérico de "non-2xx".
export const createMaterialTermGroupApi = (payload: SaveMaterialTermGroupData) =>
  invokeFunction("create-material-term-group", { method: "POST", body: payload });

export const updateMaterialTermGroupApi = (payload: SaveMaterialTermGroupData) =>
  invokeFunction("update-material-term-group", { method: "POST", body: payload });

/** Desactiva el atributo y sus términos: las variaciones que los llevan los siguen mostrando. */
export const deleteMaterialTermGroupApi = (id: number) =>
  invokeFunction("delete-material-term-group", { method: "POST", body: { id } });

export const createMaterialTermApi = (payload: SaveMaterialTermData) =>
  invokeFunction("create-material-term", { method: "POST", body: payload });

export const updateMaterialTermApi = (payload: SaveMaterialTermData) =>
  invokeFunction("update-material-term", { method: "POST", body: payload });

export const deleteMaterialTermApi = (id: number) =>
  invokeFunction("delete-material-term", { method: "POST", body: { id } });
