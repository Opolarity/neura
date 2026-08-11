import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  CategorySelector,
  fetchCategories,
  categoriesFromApiAdapter,
  type CategoryOption,
} from "@/shared/components/category-selector";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";

interface CategoryIdsFieldProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Campo de categorías de la regla de precios: persiste `category_ids` (ids),
 * pero se elige y se muestra por nombre. Los nombres de lo ya guardado salen de
 * `references` (get-price-rule-details); lo que falte ahí se pide por id a
 * get-categories-selector y, si aun así no se resuelve, queda un chip
 * "Categoría #12" que conserva el id.
 */
export const CategoryIdsField = ({
  value,
  onChange,
  label,
  placeholder,
}: CategoryIdsFieldProps) => {
  const { categories: referencedCategories } = usePriceRuleReferences();
  const [selected, setSelected] = useState<CategoryOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const known = new Map<number, string>(
        referencedCategories.map((c) => [c.id, c.name]),
      );
      const missing = value.filter((id) => !known.has(id));

      if (missing.length > 0) {
        try {
          const response = await fetchCategories({ ids: missing, size: missing.length });
          categoriesFromApiAdapter(response).data.forEach((c) => {
            known.set(c.id, c.name);
          });
        } catch (error) {
          console.error("Error loading categories for price rule field:", error);
        }
      }

      if (cancelled) return;
      setSelected(
        value.map((id) => ({ id, name: known.get(id) ?? `Categoría #${id}` })),
      );
    };

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencedCategories]);

  const handleChange = (items: CategoryOption[]) => {
    setSelected(items);
    onChange(items.map((item) => item.id));
  };

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs">{label}</Label>}
      <CategorySelector
        selectedItems={selected}
        onChangeItems={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};
