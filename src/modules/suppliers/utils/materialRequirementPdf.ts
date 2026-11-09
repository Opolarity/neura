import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import { printDocument } from "@/modules/print-templates/print/printDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  MaterialRequirementPdfData,
  MaterialRequirementPdfRow,
  SIN_CLASIFICAR,
  buildMaterialRequirementDocument,
  lista,
  money,
  qty,
  sinClaseAlFinal,
} from "./materialRequirementDocument/build";

export type {
  MaterialRequirementPdfData,
  MaterialRequirementPdfRow,
} from "./materialRequirementDocument/build";

/**
 * El requerimiento de materiales de una orden de producción.
 *
 * Es el papel con el que se sale a comprar, así que lo que manda es la columna
 * **Faltante**: lo que la orden necesita menos lo que hay en almacén. Va
 * separado de la Orden de Producción —que lleva las prendas y la ruta— porque
 * a comprar se va con una hoja de materiales, no con la orden entera.
 *
 * No vive en la receta, y no es un descuido: la receta dice lo que consume UNA
 * prenda. El requerimiento solo existe cuando hay una orden que diga cuántas
 * prendas son, y por eso encabeza con su código.
 *
 * Se imprime con su plantilla (print-templates, code `material_requirement`):
 * la personalizada en uso o la del sistema. Los datos salen con el mismo formato que el
 * PDF de antes (`materialRequirementDocument/build`), que queda sin uso.
 */

/**
 * Los datos del requerimiento para su plantilla (fuente material_requirement):
 * un material por fila, juntos por clase en el orden en que aparece cada una
 * («SIN CLASIFICAR» al final), y los datos sueltos de la cabecera.
 *
 * Como en el papel de antes, el faltante y lo que está en talleres llegan
 * vacíos en cero (el «—» de la fuente): solo saltan a la vista los que hay que
 * comprar. Una columna vacía en todo el papel no se dibuja.
 */
export const materialRequirementPrintData = (
  data: MaterialRequirementPdfData,
): PrintData => {
  const orderLabel = data.orderCode ?? `#${data.orderId}`;

  // Por clase, en el orden en que aparece cada una en la receta.
  const grupos = new Map<string, MaterialRequirementPdfRow[]>();
  data.materials.forEach((material) => {
    const clase = (material.className ?? SIN_CLASIFICAR).toUpperCase();
    grupos.set(clase, [...(grupos.get(clase) ?? []), material]);
  });

  const rows = [...grupos.keys()].sort(sinClaseAlFinal).flatMap((clase) =>
    (grupos.get(clase) ?? []).map((material) => ({
      materialClass: clase,
      material: material.name || "—",
      unit: material.measurementUnit || "—",
      quantity: qty(material.required),
      stock: material.stock !== null ? qty(material.stock) : null,
      atSuppliers:
        material.stockAtSuppliers > 0 ? qty(material.stockAtSuppliers) : null,
      missing: material.missing > 0 ? qty(material.missing) : null,
      unitCost: material.unitCost !== null ? money(material.unitCost) : null,
      amount: material.totalCost !== null ? money(material.totalCost) : null,
    })),
  );

  // En el mismo orden en que salen las secciones.
  const clases = [
    ...new Set(
      data.materials
        .map((material) => material.className)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort(sinClaseAlFinal);

  return {
    material_requirement: {
      rows,
      values: {
        requirementNumber: `REQ-${orderLabel}`,
        orderCode: orderLabel,
        orderDate: formatDateDisplay(data.createdAt),
        promisedDate: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
        requestedQuantity: qty(data.totalGarments),
        requester: data.requesterName || null,
        categories: lista(data.categories),
        modelCodes: lista(data.modelCodes),
        materialTypes: lista(clases),
        distinctMaterials: String(data.materials.length),
        toBuy: String(data.materials.filter((material) => material.missing > 0).length),
        estimatedCost: money(data.estimatedTotalCost),
        observations: data.orderNotes?.trim() || null,
      },
    },
  };
};

/** Imprime el requerimiento con su plantilla (la personalizada en uso o la del sistema). */
export const openMaterialRequirementPdf = (
  data: Parameters<typeof buildMaterialRequirementDocument>[0],
): void => {
  const orderLabel = data.orderCode ?? `#${data.orderId}`;
  void printDocument("material_requirement", materialRequirementPrintData(data), {
    fileName: `Requerimiento de Materiales ${orderLabel}`,
  });
};
