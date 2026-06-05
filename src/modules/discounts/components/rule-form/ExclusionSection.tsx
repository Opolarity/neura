import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExclusionFilter } from "../../types/priceRule.types";

interface ExclusionSectionProps {
  exclusions: ExclusionFilter | null;
  onChange: (exclusions: ExclusionFilter | null) => void;
}

const parseNumberArray = (value: string): number[] =>
  value
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

const IdsInput = ({
  value,
  onChangeIds,
  placeholder,
}: {
  value: number[];
  onChangeIds: (ids: number[]) => void;
  placeholder?: string;
}) => {
  const [text, setText] = useState(value.join(", "));

  useEffect(() => {
    setText(value.join(", "));
  }, [JSON.stringify(value)]);

  return (
    <Input
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChangeIds(parseNumberArray(text))}
    />
  );
};

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
        {/* IDs de productos */}
        <div className="space-y-1">
          <Label className="text-xs">IDs de productos excluidos (separados por coma)</Label>
          <IdsInput
            placeholder="Ej: 10, 25, 300"
            value={current.product_ids ?? []}
            onChangeIds={(ids) => update({ product_ids: ids })}
          />
        </div>

        {/* IDs de variaciones */}
        <div className="space-y-1">
          <Label className="text-xs">IDs de variaciones excluidas (separados por coma)</Label>
          <IdsInput
            placeholder="Ej: 4846, 5010"
            value={current.variation_ids ?? []}
            onChangeIds={(ids) => update({ variation_ids: ids })}
          />
        </div>
      </div>

      {/* IDs de categorías */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">IDs de categorías excluidas (separados por coma)</Label>
          <IdsInput
            placeholder="Ej: 147, 118"
            value={current.category_ids ?? []}
            onChangeIds={(ids) => update({ category_ids: ids })}
          />
        </div>
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
