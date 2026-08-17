import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import CategorySelector from "@/shared/components/category-selector/CategorySelector";
import type { CategoryOption } from "@/shared/components/category-selector/CategorySelector.types";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";

interface CategoryReferenceFieldProps {
  label: string;
  ids: number[];
  onChangeIds: (ids: number[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de categorías de las reglas de precios: chips de lo elegido + popover
 * de búsqueda. Gemelo de [ProductReferenceField] — misma forma de seleccionar
 * en condiciones y en acciones.
 *
 * Al crear la regla los chips salen de lo que el usuario elige. Al editarla
 * solo llegan los ids y el nombre sale de `references` (get-price-rule-details);
 * los ids que ese listado no traiga se conservan aunque no se pinten, para no
 * borrar lo guardado al tocar el campo.
 */
export const CategoryReferenceField = ({
  label,
  ids,
  onChangeIds,
  placeholder = "Seleccionar categorías...",
  className,
}: CategoryReferenceFieldProps) => {
  const references = usePriceRuleReferences();
  const [picked, setPicked] = useState<Record<number, CategoryOption>>({});

  const referenceOptions = useMemo(
    () =>
      references.categories.reduce<Record<number, CategoryOption>>(
        (map, reference) => {
          map[reference.id] = {
            id: reference.id,
            name: reference.name,
            imageUrl: null,
          };
          return map;
        },
        {},
      ),
    [references],
  );

  const resolve = (id: number) => picked[id] ?? referenceOptions[id];

  const selected = useMemo(
    () => ids.map(resolve).filter(Boolean) as CategoryOption[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(","), picked, referenceOptions],
  );

  const handleChangeItems = (items: CategoryOption[]) => {
    setPicked((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.id] = item;
      });
      return next;
    });
    const unresolved = ids.filter((id) => !resolve(id));
    onChangeIds([...items.map((item) => item.id), ...unresolved]);
  };

  const removeId = (id: number) => onChangeIds(ids.filter((current) => current !== id));

  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      <CategorySelector
        selectedItems={selected}
        trigger={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-start h-auto min-h-10 py-2 font-normal"
          >
            {selected.length > 0 ? (
              <span className="flex flex-wrap items-center gap-1">
                {selected.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs font-normal"
                  >
                    {category.name}
                    {/* Va como <span> y no como <Button> porque el chip vive
                        dentro del trigger del popover y un botón dentro de otro
                        botón es HTML inválido. El click se corta acá para que
                        quitar una categoría no abra la lista. */}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Quitar ${category.name}`}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeId(category.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        e.stopPropagation();
                        removeId(category.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        }
        onChangeItems={handleChangeItems}
      />
    </div>
  );
};
