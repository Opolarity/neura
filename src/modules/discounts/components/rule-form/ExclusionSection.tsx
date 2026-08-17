import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExclusionFilter } from "../../types/priceRule.types";
import { ProductReferenceField } from "./ProductReferenceField";
import { CategoryReferenceField } from "./CategoryReferenceField";

interface ExclusionSectionProps {
  exclusions: ExclusionFilter | null;
  onChange: (exclusions: ExclusionFilter | null) => void;
}

const EMPTY: ExclusionFilter = {
  product_ids: [],
  variation_ids: [],
  category_ids: [],
  include_descendants: false,
};

export const ExclusionSection = ({ exclusions, onChange }: ExclusionSectionProps) => {
  const current: ExclusionFilter = exclusions ?? EMPTY;

  const update = (patch: Partial<ExclusionFilter>) => {
    const next = { ...current, ...patch };
    const isEmpty =
      !next.product_ids?.length &&
      !next.variation_ids?.length &&
      !next.category_ids?.length;
    onChange(isEmpty ? null : next);
  };

  const hasExclusions =
    !!current.product_ids?.length ||
    !!current.variation_ids?.length ||
    !!current.category_ids?.length;

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

      {!hasExclusions && (
        <p className="text-xs text-muted-foreground italic">
          Sin exclusiones configuradas — la promoción aplica a todos los productos según las condiciones.
        </p>
      )}
    </div>
  );
};
