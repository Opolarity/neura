import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import ProductVariationSelector from "@/shared/components/product-variation-selector/ProductVariationSelector";
import type {
  ProductSelectorMode,
  ProductVariationOption,
} from "@/shared/components/product-variation-selector/ProductVariationSelector.types";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";
import { useReferenceSelection } from "../../hooks/useReferenceSelection";
import { RemovableChip } from "./RemovableChip";

interface ProductReferenceFieldProps {
  /** "product" persiste ids de producto; "variation", ids de variación. */
  mode: ProductSelectorMode;
  label: string;
  ids: number[];
  onChangeIds: (ids: number[]) => void;
  /**
   * `false` para campos de un solo id (el regalo de la regla): elegir reemplaza
   * lo anterior y cierra la lista. Por defecto se pueden elegir varios.
   */
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

// De `references` solo llega el nombre; el resto de campos de la variación no
// se usan para pintar el chip.
const optionFromName = (
  id: number,
  name: string,
  mode: ProductSelectorMode,
): ProductVariationOption => ({
  id,
  sku: "",
  productId: mode === "product" ? id : 0,
  productTitle: name,
  imageUrl: null,
  stock: 0,
  terms: [],
  prices: [],
});

const optionLabel = (option: ProductVariationOption, mode: ProductSelectorMode) => {
  if (mode === "product") return option.productTitle;
  const terms = option.terms.map((term) => term.name).join(" / ");
  const detail = terms || option.sku;
  return detail ? `${option.productTitle} (${detail})` : option.productTitle;
};

/**
 * Campo de productos/variaciones de las reglas de precios: chips de lo elegido
 * + popover de búsqueda. Lo usan tanto las acciones (target) como las
 * condiciones, para que en ambos sitios se seleccione igual.
 */
export const ProductReferenceField = ({
  mode,
  label,
  ids,
  onChangeIds,
  multiple = true,
  placeholder,
  className,
}: ProductReferenceFieldProps) => {
  const references = usePriceRuleReferences();

  const referenceOptions = useMemo(() => {
    const source = mode === "product" ? references.products : references.variations;
    return source.reduce<Record<number, ProductVariationOption>>((map, reference) => {
      map[reference.id] = optionFromName(reference.id, reference.name, mode);
      return map;
    }, {});
  }, [mode, references]);

  const { selected, remember } = useReferenceSelection(ids, referenceOptions, (id) =>
    optionFromName(
      id,
      mode === "product" ? `Producto #${id}` : `Variación #${id}`,
      mode,
    ),
  );

  const handleChangeItems = (items: ProductVariationOption[]) => {
    remember(items);
    onChangeIds(items.map((item) => item.id));
  };

  // Modo simple: lo elegido reemplaza a lo anterior.
  const handleSelectOne = (item: ProductVariationOption) => {
    remember([item]);
    onChangeIds([item.id]);
  };

  const removeId = (id: number) => onChangeIds(ids.filter((current) => current !== id));

  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      <ProductVariationSelector
        mode={mode}
        multiple={multiple}
        keepOpenOnSelect={multiple}
        selectedItems={selected}
        selectedVariation={multiple ? null : (selected[0] ?? null)}
        onSelect={handleSelectOne}
        trigger={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-start h-auto min-h-10 py-2 font-normal"
          >
            {selected.length > 0 ? (
              <span className="flex flex-wrap items-center gap-1">
                {selected.map((option) => (
                  <RemovableChip
                    key={option.id}
                    label={optionLabel(option, mode)}
                    onRemove={() => removeId(option.id)}
                  />
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder ??
                  (mode === "product"
                    ? multiple
                      ? "Seleccionar productos..."
                      : "Seleccionar producto..."
                    : multiple
                      ? "Seleccionar variaciones..."
                      : "Seleccionar variación...")}
              </span>
            )}
          </Button>
        }
        onChangeItems={handleChangeItems}
      />
    </div>
  );
};
