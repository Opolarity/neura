import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils/utils";
import ProductVariationSelector from "@/shared/components/product-variation-selector/ProductVariationSelector";
import type {
  ProductSelectorMode,
  ProductVariationOption,
} from "@/shared/components/product-variation-selector/ProductVariationSelector.types";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";

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

// Chip de algo ya guardado: de `references` solo llega el nombre, el resto de
// campos de la variación no se usan para pintarlo.
const optionFromReference = (
  reference: { id: number; name: string },
  mode: ProductSelectorMode,
): ProductVariationOption => ({
  id: reference.id,
  sku: "",
  productId: mode === "product" ? reference.id : 0,
  productTitle: reference.name,
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
 *
 * Al crear una regla los chips salen de lo que el usuario elige. Al editarla
 * solo llegan los ids, y el nombre de cada uno sale de `references`
 * (get-price-rule-details); los ids que ese listado no traiga se conservan tal
 * cual aunque no se pinten, para no borrar lo guardado al tocar el campo.
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
  const [picked, setPicked] = useState<Record<number, ProductVariationOption>>({});

  const referenceOptions = useMemo(() => {
    const source = mode === "product" ? references.products : references.variations;
    return source.reduce<Record<number, ProductVariationOption>>((map, reference) => {
      map[reference.id] = optionFromReference(reference, mode);
      return map;
    }, {});
  }, [mode, references]);

  const resolve = (id: number) => picked[id] ?? referenceOptions[id];

  const selected = useMemo(
    () => ids.map(resolve).filter(Boolean) as ProductVariationOption[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(","), picked, referenceOptions],
  );

  const handleChangeItems = (items: ProductVariationOption[]) => {
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

  // Modo simple: lo elegido reemplaza a lo anterior.
  const handleSelectOne = (item: ProductVariationOption) => {
    setPicked((prev) => ({ ...prev, [item.id]: item }));
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
        selectedVariation={multiple ? null : selected[0] ?? null}
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
                  <Badge
                    key={option.id}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs font-normal"
                  >
                    {optionLabel(option, mode)}
                    {/* Va como <span> y no como <Button> porque el chip vive
                        dentro del trigger del popover y un botón dentro de otro
                        botón es HTML inválido. El click se corta acá para que
                        quitar un elemento no abra la lista. */}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Quitar ${optionLabel(option, mode)}`}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeId(option.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        e.stopPropagation();
                        removeId(option.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </Badge>
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
