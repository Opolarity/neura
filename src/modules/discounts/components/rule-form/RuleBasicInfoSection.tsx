import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PriceRuleFormData } from "../../types/priceRule.types";

interface RuleBasicInfoSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

export const RuleBasicInfoSection = ({
  formData,
  updateField,
}: RuleBasicInfoSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información Básica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Descuento de cumpleaños"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Código interno</Label>
            <Input
              id="code"
              placeholder="Ej: BIRTHDAY_DISCOUNT"
              value={formData.code}
              onChange={(e) => updateField("code", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            placeholder="Describe qué hace esta regla..."
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de regla *</Label>
            <Select
              value={formData.rule_type}
              onValueChange={(val) =>
                updateField("rule_type", val as "automatic" | "coupon")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automática</SelectItem>
                <SelectItem value="coupon">Cupón</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad *</Label>
            <Input
              id="priority"
              type="number"
              placeholder="100"
              value={formData.priority}
              onChange={(e) => updateField("priority", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Menor número = mayor prioridad
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
