import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PriceRuleFormData } from "../../types/priceRule.types";
import { LabelRow, OptionalBadge } from "./OptionalBadge";

interface RuleValiditySectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

export const RuleValiditySection = ({
  formData,
  updateField,
}: RuleValiditySectionProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelRow>
            <Label htmlFor="valid_from">Desde</Label>
            <OptionalBadge />
          </LabelRow>
          <Input
            id="valid_from"
            type="datetime-local"
            value={formData.valid_from}
            onChange={(e) => updateField("valid_from", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Vacío: rige desde que se guarda.
          </p>
        </div>
        <div className="space-y-2">
          <LabelRow>
            <Label htmlFor="valid_to">Hasta</Label>
            <OptionalBadge />
          </LabelRow>
          <Input
            id="valid_to"
            type="datetime-local"
            value={formData.valid_to}
            onChange={(e) => updateField("valid_to", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Vacío: no vence.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label>Activa</Label>
          <p className="text-sm text-muted-foreground">
            Desactivada, no se aplica en ninguna venta.
          </p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(val) => updateField("is_active", val)}
        />
      </div>
    </div>
  );
};
