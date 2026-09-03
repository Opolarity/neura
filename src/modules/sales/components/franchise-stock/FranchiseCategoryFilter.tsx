import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FranchiseCategory } from "../../types/FranchiseStock.types";

interface FranchiseCategoryFilterProps {
  categories: FranchiseCategory[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Multiselect de categorías del franquiciado.
 *
 * Las categorías ya vienen en la respuesta del stock, así que aquí no se pide
 * nada: no hay fetch, ni paginación, ni búsqueda remota. Por eso no se reusa
 * `@/shared/components/category-selector`, que carga por su cuenta las
 * categorías de Overtake — estas son las del franquiciado y cambian con cada
 * uno.
 *
 * Las hijas se pintan indentadas bajo su padre. Marcar un padre NO marca a las
 * hijas en la UI: la expansión la hace el SP, que incluye los descendientes al
 * filtrar. Se avisa en pantalla para que no parezca que falta algo.
 */
export default function FranchiseCategoryFilter({
  categories,
  selected,
  onChange,
}: FranchiseCategoryFilterProps) {
  // Raíces ordenadas, cada una seguida de sus hijas. Las huérfanas (padre que
  // no está en la lista) se tratan como raíz para que no desaparezcan.
  const ordered = useMemo(() => {
    const byId = new Set(categories.map((c) => c.id));
    const roots = categories.filter(
      (c) => c.parentId === null || !byId.has(c.parentId),
    );
    const childrenOf = (id: number) =>
      categories.filter((c) => c.parentId === id);

    return roots.flatMap((root) => [
      { category: root, depth: 0 },
      ...childrenOf(root.id).map((child) => ({ category: child, depth: 1 })),
    ]);
  }, [categories]);

  const toggle = (id: number) => {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  if (categories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Este franquiciado no tiene categorías registradas.
      </p>
    );
  }

  const hasParentSelected = ordered.some(
    ({ category, depth }) =>
      depth === 0 &&
      selected.includes(category.id) &&
      categories.some((c) => c.parentId === category.id),
  );

  return (
    <div className="space-y-2">
      <div className="rounded-md border max-h-48 overflow-y-auto p-1">
        {ordered.map(({ category, depth }) => (
          <label
            key={category.id}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
            style={{ paddingLeft: depth ? `${depth * 1.25 + 0.5}rem` : undefined }}
          >
            <Checkbox
              checked={selected.includes(category.id)}
              onCheckedChange={() => toggle(category.id)}
            />
            <span className={depth ? "text-muted-foreground" : undefined}>
              {category.name}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {selected.length === 0
            ? "Todas las categorías"
            : `${selected.length} seleccionada${selected.length === 1 ? "" : "s"}`}
          {hasParentSelected && " · incluye subcategorías"}
        </p>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-0.5 text-xs"
            onClick={() => onChange([])}
          >
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}
