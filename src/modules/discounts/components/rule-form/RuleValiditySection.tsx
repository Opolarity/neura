import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PriceRuleFormData } from "../../types/priceRule.types";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Validez</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Activa</Label>
            <p className="text-sm text-muted-foreground">
              Activar o desactivar esta regla
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(val) => updateField("is_active", val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valid_from">Válida desde</Label>
            <Input
              id="valid_from"
              type="datetime-local"
              value={formData.valid_from}
              onChange={(e) => updateField("valid_from", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_to">Válida hasta</Label>
            <Input
              id="valid_to"
              type="datetime-local"
              value={formData.valid_to}
              onChange={(e) => updateField("valid_to", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_list_id">Lista de precios (opcional)</Label>
          <Input
            id="price_list_id"
            type="number"
            placeholder="Dejar vacío para aplicar a todas"
            value={formData.price_list_id ?? ""}
            onChange={(e) =>
              updateField(
                "price_list_id",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Si se especifica, la regla solo aplica a esta lista de precios
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
