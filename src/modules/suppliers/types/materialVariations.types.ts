/**
 * Una variación de material tal como la ofrecen los selectores: lo que se
 * compra, se envía o se consume ("Jersey 30/1 · Negro"), con la unidad del
 * material y el costo y proveedor de la variación.
 */
export interface MaterialVariationOption {
  id: number;
  code: string;
  materialId: number;
  materialName: string;
  /** Solo los valores de atributo ("Negro · 14 cm"); null si no tiene. */
  termsLabel: string | null;
  /** Material y atributos: "Cierre YKK · Negro · 14 cm". */
  label: string;
  measurementUnit: string;
  unitCost: number | null;
  supplierId: number | null;
  supplierName: string | null;
  materialClassId: number | null;
  materialClassName: string;
  isActive: boolean;
}

/** Respuesta cruda de `sp_get_material_variation_options`. */
export interface MaterialVariationOptionApi {
  id: number;
  code: string | null;
  material_id: number;
  material_name: string | null;
  terms_label: string | null;
  label: string | null;
  measurement_unit: string | null;
  unit_cost: number | string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  material_class_id: number | null;
  material_class_name: string | null;
  is_active: boolean | null;
}

export interface MaterialVariationOptionsFilters {
  search?: string | null;
  size?: number;
  materialId?: number | null;
  /** Las ya elegidas: se devuelven aunque no entren en la búsqueda. */
  ids?: number[];
}
