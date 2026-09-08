import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExclusionFilter } from "../../types/priceRule.types";
import { ProductReferenceField } from "./ProductReferenceField";
import { CategoryReferenceField } from "./CategoryReferenceField";
import { TagReferenceField } from "./TagReferenceField";

interface ExclusionSectionProps {
  exclusions: ExclusionFilter | null;
  onChange: (exclusions: ExclusionFilter | null) => void;
}

const EMPTY: ExclusionFilter = {
  product_ids: [],
  variation_ids: [],
  category_ids: [],
  brand_ids: [],
  tag_ids: [],
  include_descendants: false,
};

export const ExclusionSection = ({ exclusions, onChange }: ExclusionSectionProps) => {
  const current: ExclusionFilter = exclusions ?? EMPTY;

  const hasAny = (source: ExclusionFilter) =>
    !!source.product_ids?.length ||
    !!source.variation_ids?.length ||
    !!source.category_ids?.length ||
    !!source.brand_ids?.length ||
    !!source.tag_ids?.length;

  const update = (patch: Partial<ExclusionFilter>) => {
    const next = { ...current, ...patch };
    onChange(hasAny(next) ? next : null);
  };

  const hasExclusions = hasAny(current);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Los productos que coincidan con cualquiera de los criterios a continuación
        quedarán fuera de esta promoción (no recibirán ningún descuento de esta regla).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProductReferenceField
          mode="product"
          label="Productos excluidos"
          ids={current.product_ids ?? []}
          onChangeIds={(ids) => update({ product_ids: ids })}
        />

        <ProductReferenceField
          mode="variation"
          label="Variaciones excluidas"
          ids={current.variation_ids ?? []}
          onChangeIds={(ids) => update({ variation_ids: ids })}
        />
      </div>

      <div className="space-y-2">
        <CategoryReferenceField
          label="Categorías excluidas"
          ids={current.category_ids ?? []}
          onChangeIds={(ids) => update({ category_ids: ids })}
        />
        {!!current.category_ids?.length && (
          <div className="flex items-center gap-2">
            <Switch
              checked={current.include_descendants ?? false}
              onCheckedChange={(val) => update({ include_descendants: val })}
            />
            <Label className="text-xs">Incluir subcategorías</Label>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagReferenceField
          kind="brand"
          label="Marcas excluidas"
          ids={current.brand_ids ?? []}
          onChangeIds={(ids) => update({ brand_ids: ids })}
        />

        <TagReferenceField
          kind="tag"
          label="Etiquetas excluidas"
          ids={current.tag_ids ?? []}
          onChangeIds={(ids) => update({ tag_ids: ids })}
        />
      </div>

      {!hasExclusions && (
        <p className="text-xs text-muted-foreground italic">
          Sin exclusiones configuradas — la promoción aplica a todos los productos según las condiciones.
        </p>
      )}
    </div>
  );
};
