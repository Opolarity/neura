import { useEffect, useState } from "react";
import { getTags } from "@/shared/services/service";
import type { TagsResponse } from "@/shared/types/type";

/** Discriminador de la tabla `tags`: marcas y etiquetas comparten tabla. */
export type ProductTagKind = "brand" | "tag";

export interface ProductTagOption {
  id: number;
  name: string;
  code: string;
}

/**
 * La tabla `tags` guarda marcas y etiquetas juntas y es corta (decenas de
 * filas), así que se trae entera y se reparte por `type` en memoria. La promesa
 * se cachea a nivel de módulo para que varios campos montados a la vez —el
 * formulario de reglas puede tener condición, target y exclusión de marca en
 * pantalla— no disparen la misma consulta una vez por campo.
 */
let tagsPromise: Promise<TagsResponse[]> | null = null;

const loadTags = (): Promise<TagsResponse[]> => {
  if (!tagsPromise) {
    tagsPromise = getTags().catch((error) => {
      // Un fallo no debe dejar la caché envenenada: el siguiente montaje reintenta.
      tagsPromise = null;
      throw error;
    });
  }
  return tagsPromise;
};

/**
 * Marcas (`brand`) o etiquetas (`tag`) disponibles, ordenadas por nombre.
 * Fuente compartida por los selectores de productos y por el formulario de
 * reglas de precios.
 */
export function useProductTagOptions(kind: ProductTagKind) {
  const [options, setOptions] = useState<ProductTagOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadTags()
      .then((all) => {
        if (cancelled) return;
        setOptions(
          all
            .filter((item) => item.type === kind)
            .map(({ id, name, code }) => ({ id, name, code }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch((error) => {
        if (!cancelled) console.error("Error loading tags:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { options, loading };
}
