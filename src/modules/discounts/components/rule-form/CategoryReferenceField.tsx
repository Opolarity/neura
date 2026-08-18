import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import CategorySelector from "@/shared/components/category-selector/CategorySelector";
import type { CategoryOption } from "@/shared/components/category-selector/CategorySelector.types";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";
import { useReferenceSelection } from "../../hooks/useReferenceSelection";
import { RemovableChip } from "./RemovableChip";

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
 */
export const CategoryReferenceField = ({
  label,
  ids,
  onChangeIds,
  placeholder = "Seleccionar categorías...",
  className,
}: CategoryReferenceFieldProps) => {
  const references = usePriceRuleReferences();

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

  const { selected, remember } = useReferenceSelection(ids, referenceOptions, (id) => ({
    id,
    name: `Categoría #${id}`,
    imageUrl: null,
  }));

  const handleChangeItems = (items: CategoryOption[]) => {
    remember(items);
    onChangeIds(items.map((item) => item.id));
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
                  <RemovableChip
                    key={category.id}
                    label={category.name}
                    onRemove={() => removeId(category.id)}
                  />
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
