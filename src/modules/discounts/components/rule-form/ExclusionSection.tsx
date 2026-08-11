import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExclusionFilter } from "../../types/priceRule.types";
import { ProductIdsField, VariationIdsField } from "./EntityIdFields";
import { CategoryIdsField } from "./CategoryIdsField";

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
        <ProductIdsField
          label="Productos excluidos"
          value={current.product_ids ?? []}
          onChange={(ids) => update({ product_ids: ids })}
        />

        <VariationIdsField
          label="Variaciones excluidas"
          value={current.variation_ids ?? []}
          onChange={(ids) => update({ variation_ids: ids })}
        />
      </div>

      <div className="space-y-2">
        <CategoryIdsField
          label="Categorías excluidas"
          value={current.category_ids ?? []}
          onChange={(ids) => update({ category_ids: ids })}
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
