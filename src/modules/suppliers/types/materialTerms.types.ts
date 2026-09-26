/**
 * Atributos de material: lo que distingue a dos variaciones del mismo material
 * (Color: Negro / Blanco; Largo: 14 cm / 16 cm; Talla: 28 / 30).
 *
 * Son un catálogo aparte de los atributos de producto: la «Talla» de una
 * etiqueta no es la «Talla» de un polo.
 */

/** Un término del atributo (Negro, 14 cm). */
export interface MaterialTerm {
  id: number;
  name: string;
  isActive: boolean;
  /** Cuántas variaciones de material lo llevan. */
  variationsCount: number;
}

/** Un atributo (Color, Largo) con sus términos. */
export interface MaterialTermGroup {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  variationsCount: number;
  terms: MaterialTerm[];
}

/** Respuesta cruda de `sp_get_material_terms`. */
export interface MaterialTermGroupApi {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  variations_count: number;
  terms: Array<{
    id: number;
    name: string;
    is_active: boolean;
    variations_count: number;
  }>;
}

export interface SaveMaterialTermGroupData {
  id?: number;
  code: string | null;
  name: string;
}

export interface SaveMaterialTermData {
  id?: number;
  material_term_group_id: number;
  name: string;
}
