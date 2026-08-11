import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  ProductVariationSelector,
  fetchProducts,
  productsFromApiAdapter,
  type ProductVariationOption,
} from "@/shared/components/product-variation-selector";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";

/**
 * Campos de la regla de precios que persisten ids (product_ids, variation_ids,
 * variation_id) pero se eligen y se muestran por nombre con el selector
 * compartido: chips con una X para quitar y check en el popover.
 *
 * Los nombres de lo ya guardado salen de `references` (get-price-rule-details);
 * para productos, lo que falte ahí se pide por id a get-products-selector y, si
 * aun así no se resuelve, se conserva el id en un chip "Producto #12".
 */

type EntityKind = "product" | "variation";

const placeholderOption = (
  id: number,
  kind: EntityKind,
  name?: string,
): ProductVariationOption => ({
  id,
  sku: "",
  productId: id,
  productTitle:
    name ?? (kind === "product" ? `Producto #${id}` : `Variación #${id}`),
  imageUrl: null,
  stock: 0,
  terms: [],
  prices: [],
});

/**
 * Mantiene los chips (id + nombre) de una lista de ids. Se rehidrata solo
 * cuando llegan las referencias: mientras el usuario edita, el estado lo maneja
 * el propio selector.
 */
const useHydratedOptions = (ids: number[], kind: EntityKind) => {
  const references = usePriceRuleReferences();
  const referenced =
    kind === "product" ? references.products : references.variations;
  const [options, setOptions] = useState<ProductVariationOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const known = new Map<number, string>(
        referenced.map((item) => [item.id, item.name]),
      );
      const missing = ids.filter((id) => !known.has(id));

      if (kind === "product" && missing.length > 0) {
        try {
          const response = await fetchProducts({
            ids: missing,
            size: missing.length,
          });
          productsFromApiAdapter(response).data.forEach((product) => {
            known.set(product.id, product.productTitle);
          });
        } catch (error) {
          console.error("Error loading products for price rule field:", error);
        }
      }

      if (cancelled) return;
      setOptions(ids.map((id) => placeholderOption(id, kind, known.get(id))));
    };

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenced]);

  return [options, setOptions] as const;
};

interface IdsFieldProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
}

const IdsField = ({
  kind,
  value,
  onChange,
  label,
  placeholder,
}: IdsFieldProps & { kind: EntityKind }) => {
  const [selected, setSelected] = useHydratedOptions(value, kind);

  const handleChange = (items: ProductVariationOption[]) => {
    setSelected(items);
    onChange(items.map((item) => item.id));
  };

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs">{label}</Label>}
      <ProductVariationSelector
        mode={kind}
        multiple
        keepOpenOnSelect
        showStock={false}
        selectedItems={selected}
        onChangeItems={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export const ProductIdsField = (props: IdsFieldProps) => (
  <IdsField
    kind="product"
    placeholder="Buscar producto por nombre o SKU..."
    {...props}
  />
);

export const VariationIdsField = (props: IdsFieldProps) => (
  <IdsField
    kind="variation"
    placeholder="Buscar variación por nombre o SKU..."
    {...props}
  />
);

interface VariationIdFieldProps {
  value?: number;
  onChange: (id: number) => void;
  label?: string;
  placeholder?: string;
}

/** Selección de UNA variación (el regalo de la acción free_gift). */
export const VariationIdField = ({
  value,
  onChange,
  label,
  placeholder = "Buscar variación por nombre o SKU...",
}: VariationIdFieldProps) => {
  const ids = value && value > 0 ? [value] : [];
  const [selected, setSelected] = useHydratedOptions(ids, "variation");

  const handleSelect = (variation: ProductVariationOption) => {
    setSelected([variation]);
    onChange(variation.id);
  };

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs">{label}</Label>}
      <ProductVariationSelector
        selectedVariation={selected[0] ?? null}
        onSelect={handleSelect}
        placeholder={placeholder}
      />
    </div>
  );
};
