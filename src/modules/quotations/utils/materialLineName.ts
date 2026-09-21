import { MaterialLinkValue } from "@/modules/suppliers/types/materialLink.types";

/**
 * Cómo se llama una línea de compra cuando se le vincula un material.
 *
 * Rellena si está vacía **y sigue al material**: se sobreescribe cuando la
 * descripción está en blanco o cuando es exactamente el nombre del material
 * anterior. Así cambiar de material actualiza el nombre, pero lo que la persona
 * escribió a mano no se pisa nunca.
 *
 * Al desvincular no se borra: eso perdería trabajo, y una línea sin material
 * sigue necesitando llamarse de alguna forma.
 */
export const nextLineDescription = (
  current: string,
  previous: MaterialLinkValue,
  next: MaterialLinkValue,
): string => {
  const name = next.materialName?.trim() ?? "";
  if (name === "") return current;

  const typedByHand =
    current.trim() !== "" &&
    current.trim() !== (previous.materialName?.trim() ?? "");

  return typedByHand ? current : name;
};
