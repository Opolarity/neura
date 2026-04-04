import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Condition, ConditionType } from "../../types/priceRule.types";
import { CONDITION_TYPE_LABELS } from "../../types/priceRule.types";

interface ConditionRowProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

export const ConditionRow = ({ condition, onChange, onRemove }: ConditionRowProps) => {
  const handleTypeChange = (type: ConditionType) => {
    // Reset condition fields when type changes
    const base: Record<string, unknown> = { type };
    switch (type) {
      case "cart_subtotal":
        Object.assign(base, { operator: "gte", value: 0 });
        break;
      case "product_in_cart":
        Object.assign(base, { product_ids: [], min_quantity: 1 });
        break;
      case "category_in_cart":
        Object.assign(base, { category_ids: [], min_quantity: 1, include_descendants: true });
        break;
      case "min_total_quantity":
        Object.assign(base, { value: 1 });
        break;
      case "min_category_quantity":
        Object.assign(base, { category_ids: [], value: 1, include_descendants: true });
        break;
      case "customer_level":
        Object.assign(base, { min_points: 0, max_points: undefined });
        break;
      case "payment_method":
        Object.assign(base, { payment_method_codes: [] });
        break;
      case "customer_birthday":
        Object.assign(base, { days_before: 0, days_after: 7 });
        break;
      case "date_range":
        Object.assign(base, { from: "", to: "" });
        break;
      // new_customer and variation_in_cart have no extra fields or similar pattern
    }
    onChange(base as Condition);
  };

  const updateField = (key: string, value: unknown) => {
    onChange({ ...condition, [key]: value } as Condition);
  };

  const parseNumberArray = (value: string): number[] => {
    return value
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  };

  const renderFields = () => {
    switch (condition.type) {
      case "cart_subtotal":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Operador</Label>
              <Select
                value={(condition as any).operator || "gte"}
                onValueChange={(val) => updateField("operator", val)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gte">Mayor o igual</SelectItem>
                  <SelectItem value="lte">Menor o igual</SelectItem>
                  <SelectItem value="between">Entre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor</Label>
              <Input
                type="number"
                className="w-[120px]"
                value={(condition as any).value ?? 0}
                onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
              />
            </div>
            {(condition as any).operator === "between" && (
              <div className="space-y-1">
                <Label className="text-xs">Valor 2</Label>
                <Input
                  type="number"
                  className="w-[120px]"
                  value={(condition as any).value2 ?? 0}
                  onChange={(e) => updateField("value2", parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
        );

      case "product_in_cart":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">IDs de productos (separados por coma)</Label>
              <Input
                placeholder="1, 2, 3"
                value={((condition as any).product_ids ?? []).join(", ")}
                onChange={(e) => updateField("product_ids", parseNumberArray(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cant. mín.</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).min_quantity ?? 1}
                onChange={(e) => updateField("min_quantity", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case "variation_in_cart":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">IDs de variaciones (separados por coma)</Label>
              <Input
                placeholder="10, 20, 30"
                value={((condition as any).variation_ids ?? []).join(", ")}
                onChange={(e) => updateField("variation_ids", parseNumberArray(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cant. mín.</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).min_quantity ?? 1}
                onChange={(e) => updateField("min_quantity", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case "category_in_cart":
        return (
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">IDs de categorías (separados por coma)</Label>
              <Input
                placeholder="147, 118"
                value={((condition as any).category_ids ?? []).join(", ")}
                onChange={(e) => updateField("category_ids", parseNumberArray(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cant. mín.</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).min_quantity ?? 1}
                onChange={(e) => updateField("min_quantity", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                checked={(condition as any).include_descendants ?? true}
                onCheckedChange={(val) => updateField("include_descendants", val)}
              />
              <Label className="text-xs">Incluir subcategorías</Label>
            </div>
          </div>
        );

      case "min_total_quantity":
        return (
          <div className="space-y-1">
            <Label className="text-xs">Cantidad mínima</Label>
            <Input
              type="number"
              className="w-[120px]"
              value={(condition as any).value ?? 1}
              onChange={(e) => updateField("value", parseInt(e.target.value) || 1)}
            />
          </div>
        );

      case "min_category_quantity":
        return (
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">IDs de categorías</Label>
              <Input
                placeholder="147, 118"
                value={((condition as any).category_ids ?? []).join(", ")}
                onChange={(e) => updateField("category_ids", parseNumberArray(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad mín.</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).value ?? 1}
                onChange={(e) => updateField("value", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                checked={(condition as any).include_descendants ?? true}
                onCheckedChange={(val) => updateField("include_descendants", val)}
              />
              <Label className="text-xs">Incluir subcategorías</Label>
            </div>
          </div>
        );

      case "customer_level":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Puntos mín.</Label>
              <Input
                type="number"
                className="w-[120px]"
                value={(condition as any).min_points ?? 0}
                onChange={(e) => updateField("min_points", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Puntos máx.</Label>
              <Input
                type="number"
                className="w-[120px]"
                placeholder="Sin límite"
                value={(condition as any).max_points ?? ""}
                onChange={(e) =>
                  updateField("max_points", e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        );

      case "payment_method":
        return (
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Códigos de método de pago (separados por coma)</Label>
            <Input
              placeholder="MERCP, PWRPY"
              value={((condition as any).payment_method_codes ?? []).join(", ")}
              onChange={(e) =>
                updateField(
                  "payment_method_codes",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
            />
          </div>
        );

      case "new_customer":
        return (
          <p className="text-sm text-muted-foreground pt-2">
            Se aplica cuando el cliente no tiene pedidos anteriores
          </p>
        );

      case "customer_birthday":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Días antes</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).days_before ?? 0}
                onChange={(e) => updateField("days_before", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Días después</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={(condition as any).days_after ?? 7}
                onChange={(e) => updateField("days_after", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        );

      case "date_range":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="datetime-local"
                value={(condition as any).from ?? ""}
                onChange={(e) => updateField("from", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="datetime-local"
                value={(condition as any).to ?? ""}
                onChange={(e) => updateField("to", e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3 items-start p-3 border rounded-lg bg-muted/30">
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Tipo de condición</Label>
          <Select
            value={condition.type}
            onValueChange={(val) => handleTypeChange(val as ConditionType)}
          >
            <SelectTrigger className="w-full max-w-[280px]">
              <SelectValue placeholder="Seleccionar condición" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONDITION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {renderFields()}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="mt-6">
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
};
