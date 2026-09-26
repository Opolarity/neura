import {
  MaterialTermGroup,
  MaterialTermGroupApi,
} from "../types/materialTerms.types";

export const toMaterialTermGroup = (
  raw: MaterialTermGroupApi,
): MaterialTermGroup => ({
  id: Number(raw.id),
  code: raw.code ?? "",
  name: raw.name ?? "",
  isActive: raw.is_active !== false,
  variationsCount: Number(raw.variations_count ?? 0),
  terms: (raw.terms ?? []).map((value) => ({
    id: Number(value.id),
    name: value.name ?? "",
    isActive: value.is_active !== false,
    variationsCount: Number(value.variations_count ?? 0),
  })),
});
