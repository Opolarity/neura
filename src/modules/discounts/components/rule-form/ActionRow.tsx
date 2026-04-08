import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionConfig, ActionType, TargetFilter } from "../../types/priceRule.types";
import { ACTION_TYPE_LABELS } from "../../types/priceRule.types";

interface ActionRowProps {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
  onRemove: () => void;
}

const DEFAULT_TARGET: TargetFilter = {
  apply_to: "all",
};

const parseNumberArray = (value: string): number[] => {
  return value
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
};

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

const TargetFilterEditor = ({
  target,
  onChange,
}: {
  target: TargetFilter;
  onChange: (target: TargetFilter) => void;
}) => {
  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      <div className="space-y-1">
        <Label className="text-xs">Aplicar a</Label>
        <Select
          value={target.apply_to}
          onValueChange={(val) =>
            onChange({ ...target, apply_to: val as TargetFilter["apply_to"] })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            <SelectItem value="specific_products">Productos específicos</SelectItem>
            <SelectItem value="specific_categories">Categorías específicas</SelectItem>
            <SelectItem value="specific_variations">Variaciones específicas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {target.apply_to === "specific_products" && (
        <div className="space-y-1">
          <Label className="text-xs">IDs de productos (separados por coma)</Label>
          <IdsInput
            placeholder="1, 2, 3"
            value={target.product_ids ?? []}
            onChangeIds={(ids) => onChange({ ...target, product_ids: ids })}
          />
        </div>
      )}

      {target.apply_to === "specific_categories" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">IDs de categorías (separados por coma)</Label>
            <IdsInput
              placeholder="147, 118"
              value={target.category_ids ?? []}
              onChangeIds={(ids) => onChange({ ...target, category_ids: ids })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={target.include_descendants ?? true}
              onCheckedChange={(val) =>
                onChange({ ...target, include_descendants: val })
              }
            />
            <Label className="text-xs">Incluir subcategorías</Label>
          </div>
        </>
      )}

      {target.apply_to === "specific_variations" && (
        <div className="space-y-1">
          <Label className="text-xs">IDs de variaciones (separados por coma)</Label>
          <IdsInput
            placeholder="10, 20, 30"
            value={target.variation_ids ?? []}
            onChangeIds={(ids) => onChange({ ...target, variation_ids: ids })}
          />
        </div>
      )}
    </div>
  );
};

export const ActionRow = ({ action, onChange, onRemove }: ActionRowProps) => {
  const handleTypeChange = (type: ActionType) => {
    const base: Record<string, unknown> = { type };
    switch (type) {
      case "fixed_discount_subtotal":
      case "percent_discount_subtotal":
      case "payment_surcharge_percent":
      case "shipping_discount_fixed":
      case "shipping_discount_percent":
        Object.assign(base, { value: 0 });
        break;
      case "fixed_discount_per_product":
      case "percent_discount_per_product":
      case "set_fixed_price":
        Object.assign(base, { value: 0, target: DEFAULT_TARGET });
        break;
      case "tiered_pack_pricing":
        Object.assign(base, { tiers: [{ qty: 3, unit_price: 0 }], target: DEFAULT_TARGET });
        break;
      case "buy_x_get_y":
        Object.assign(base, { buy_qty: 2, get_qty: 1, discount_percent: 100, apply_to_cheapest: true, target: DEFAULT_TARGET });
        break;
      case "free_gift":
        Object.assign(base, { variation_id: 0, quantity: 1 });
        break;
      case "free_shipping":
        break;
    }
    onChange(base as ActionConfig);
  };

  const updateField = (key: string, value: unknown) => {
    onChange({ ...action, [key]: value } as ActionConfig);
  };

  const renderFields = () => {
    switch (action.type) {
      case "fixed_discount_subtotal":
        return (
          <div className="space-y-1">
            <Label className="text-xs">Monto de descuento (S/)</Label>
            <Input
              type="number"
              className="w-[140px]"
              value={action.value ?? 0}
              onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case "percent_discount_subtotal":
        return (
          <div className="space-y-1">
            <Label className="text-xs">Porcentaje de descuento (%)</Label>
            <Input
              type="number"
              className="w-[140px]"
              value={action.value ?? 0}
              onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case "fixed_discount_per_product":
      case "percent_discount_per_product":
      case "set_fixed_price":
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">
                {action.type === "set_fixed_price"
                  ? "Precio fijo (S/)"
                  : action.type === "percent_discount_per_product"
                  ? "Porcentaje (%)"
                  : "Descuento (S/)"}
              </Label>
              <Input
                type="number"
                className="w-[140px]"
                value={action.value ?? 0}
                onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
              />
            </div>
            <TargetFilterEditor
              target={action.target || DEFAULT_TARGET}
              onChange={(t) => updateField("target", t)}
            />
          </div>
        );

      case "tiered_pack_pricing": {
        const tiers = action.tiers ?? [{ qty: 3, unit_price: 0 }];
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Escalas de precio</Label>
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      className="w-[100px]"
                      value={tier.qty}
                      onChange={(e) => {
                        const newTiers = [...tiers];
                        newTiers[idx] = { ...tier, qty: parseInt(e.target.value) || 0 };
                        updateField("tiers", newTiers);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Precio unitario (S/)</Label>
                    <Input
                      type="number"
                      className="w-[140px]"
                      value={tier.unit_price}
                      onChange={(e) => {
                        const newTiers = [...tiers];
                        newTiers[idx] = { ...tier, unit_price: parseFloat(e.target.value) || 0 };
                        updateField("tiers", newTiers);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      updateField("tiers", tiers.filter((_, i) => i !== idx));
                    }}
                    disabled={tiers.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateField("tiers", [...tiers, { qty: 2, unit_price: 0 }])}
              >
                Agregar escala
              </Button>
            </div>
            <TargetFilterEditor
              target={action.target || DEFAULT_TARGET}
              onChange={(t) => updateField("target", t)}
            />
          </div>
        );
      }

      case "buy_x_get_y":
        return (
          <div className="space-y-3">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Comprar (X)</Label>
                <Input
                  type="number"
                  className="w-[100px]"
                  value={action.buy_qty ?? 2}
                  onChange={(e) => updateField("buy_qty", parseInt(e.target.value) || 2)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Llevar con dto. (Y)</Label>
                <Input
                  type="number"
                  className="w-[100px]"
                  value={action.get_qty ?? 1}
                  onChange={(e) => updateField("get_qty", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% descuento</Label>
                <Input
                  type="number"
                  className="w-[100px]"
                  placeholder="100 = gratis"
                  value={action.discount_percent ?? 100}
                  onChange={(e) => updateField("discount_percent", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ej: 2x1 = Comprar 2, llevar 1 al 100% dto. | 2da al 50% = Comprar 2, llevar 1 al 50% dto.
            </p>
            <div className="flex items-center gap-2">
              <Switch
                checked={action.apply_to_cheapest ?? true}
                onCheckedChange={(val) => updateField("apply_to_cheapest", val)}
              />
              <Label className="text-xs">Aplicar descuento a la prenda más económica</Label>
            </div>
            <TargetFilterEditor
              target={action.target || DEFAULT_TARGET}
              onChange={(t) => updateField("target", t)}
            />
          </div>
        );

      case "free_gift":
        return (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">ID de variación del regalo</Label>
              <Input
                type="number"
                className="w-[160px]"
                value={action.variation_id ?? 0}
                onChange={(e) => updateField("variation_id", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad</Label>
              <Input
                type="number"
                className="w-[100px]"
                value={action.quantity ?? 1}
                onChange={(e) => updateField("quantity", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        );

      case "free_shipping":
        return (
          <p className="text-sm text-muted-foreground pt-2">
            Se eliminará el costo de envío
          </p>
        );

      case "shipping_discount_fixed":
      case "shipping_discount_percent":
        return (
          <div className="space-y-1">
            <Label className="text-xs">
              {action.type === "shipping_discount_percent"
                ? "Porcentaje de descuento (%)"
                : "Descuento fijo en envío (S/)"}
            </Label>
            <Input
              type="number"
              className="w-[140px]"
              value={action.value ?? 0}
              onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case "payment_surcharge_percent":
        return (
          <div className="space-y-1">
            <Label className="text-xs">Porcentaje de recargo (%)</Label>
            <Input
              type="number"
              className="w-[140px]"
              value={action.value ?? 0}
              onChange={(e) => updateField("value", parseFloat(e.target.value) || 0)}
            />
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
          <Label className="text-xs">Tipo de acción</Label>
          <Select
            value={action.type}
            onValueChange={(val) => handleTypeChange(val as ActionType)}
          >
            <SelectTrigger className="w-full max-w-[280px]">
              <SelectValue placeholder="Seleccionar acción" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
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
