import { MaterialOption } from "./services.types";

/**
 * Un servicio de cotización puede no tener material, o estar vinculado a
 * uno (existente, o recién creado desde el propio popup del selector).
 */
export interface MaterialLinkValue {
  linked: boolean;
  materialId: number | null;
  materialName: string | null;
  /** Unidad del material vinculado: manda sobre la del servicio. */
  materialUnit: string | null;
}

export const emptyMaterialLink = (): MaterialLinkValue => ({
  linked: false,
  materialId: null,
  materialName: null,
  materialUnit: null,
});

/** Estado inicial a partir de un material ya vinculado (edición). */
export const materialLinkFromExisting = (
  materialId: number | null,
  materialName: string | null,
  materialUnit: string | null
): MaterialLinkValue =>
  materialId === null
    ? emptyMaterialLink()
    : { linked: true, materialId, materialName, materialUnit };

export const selectExistingMaterial = (
  material: MaterialOption
): MaterialLinkValue => ({
  linked: true,
  materialId: material.id,
  materialName: material.name,
  materialUnit: material.measurementUnit,
});

/**
 * Unidad de medida efectiva del servicio: si hay material vinculado la
 * define el material, no el formulario. El backend aplica la misma regla.
 */
export const materialLinkUnit = (value: MaterialLinkValue): string | null =>
  value.linked ? value.materialUnit : null;

/** Motivo por el que el vínculo no está completo, o null si es válido. */
export const materialLinkError = (value: MaterialLinkValue): string | null => {
  if (value.linked && value.materialId === null) {
    return "Selecciona o crea el material a vincular";
  }
  return null;
};

/** Parte del payload que entiende el backend (`material_id`). */
export const materialLinkPayload = (value: MaterialLinkValue) => ({
  material_id: value.linked ? value.materialId : null,
});
