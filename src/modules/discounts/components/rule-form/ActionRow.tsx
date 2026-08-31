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
import {
  ACTION_TYPE_LABELS,
  DEFAULT_INCLUDE_DESCENDANTS,
} from "../../types/priceRule.types";
import { ProductReferenceField } from "./ProductReferenceField";
import { CategoryReferenceField } from "./CategoryReferenceField";
import { TagReferenceField } from "./TagReferenceField";

interface ActionRowProps {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
  onRemove: () => void;
}

const DEFAULT_TARGET: TargetFilter = {
  apply_to: "all",
};

const TargetFilterEditor = ({
  target,
  onChange,
}: {
  target: TargetFilter;
  onChange: (target: TargetFilter) => void;
}) => {
  // Al cambiar de destino se reconstruye el target con las claves de ese
  // destino y sus valores por defecto: así lo que se ve marcado es lo que se
  // guarda, y no quedan ids del destino anterior colgando en el JSON.
  const handleApplyToChange = (applyTo: TargetFilter["apply_to"]) => {
    switch (applyTo) {
      case "specific_products":
        return onChange({ apply_to: applyTo, product_ids: target.product_ids ?? [] });
      case "specific_variations":
        return onChange({ apply_to: applyTo, variation_ids: target.variation_ids ?? [] });
      case "specific_brands":
        return onChange({ apply_to: applyTo, brand_ids: target.brand_ids ?? [] });
      case "specific_tags":
        return onChange({ apply_to: applyTo, tag_ids: target.tag_ids ?? [] });
      case "specific_categories":
        return onChange({
          apply_to: applyTo,
          category_ids: target.category_ids ?? [],
          include_descendants:
            target.include_descendants ?? DEFAULT_INCLUDE_DESCENDANTS,
        });
      default:
        return onChange({ apply_to: applyTo });
    }
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      <div className="space-y-1">
        <Label className="text-xs">Aplicar a</Label>
        <Select
          value={target.apply_to}
          onValueChange={(val) =>
            handleApplyToChange(val as TargetFilter["apply_to"])
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
            <SelectItem value="specific_brands">Marcas específicas</SelectItem>
            <SelectItem value="specific_tags">Etiquetas específicas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {target.apply_to === "specific_products" && (
        <ProductReferenceField
          mode="product"
          label="Productos"
          ids={target.product_ids ?? []}
          onChangeIds={(ids) => onChange({ ...target, product_ids: ids })}
        />
      )}

      {target.apply_to === "specific_categories" && (
        <>
          <CategoryReferenceField
            label="Categorías"
            ids={target.category_ids ?? []}
            onChangeIds={(ids) => onChange({ ...target, category_ids: ids })}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={
                target.include_descendants ?? DEFAULT_INCLUDE_DESCENDANTS
              }
              onCheckedChange={(val) =>
                onChange({ ...target, include_descendants: val })
              }
            />
            <Label className="text-xs">Incluir subcategorías</Label>
          </div>
        </>
      )}

      {target.apply_to === "specific_variations" && (
        <ProductReferenceField
          mode="variation"
          label="Variaciones"
          ids={target.variation_ids ?? []}
          onChangeIds={(ids) => onChange({ ...target, variation_ids: ids })}
        />
      )}

      {target.apply_to === "specific_brands" && (
        <TagReferenceField
          kind="brand"
          label="Marcas"
          ids={target.brand_ids ?? []}
          onChangeIds={(ids) => onChange({ ...target, brand_ids: ids })}
        />
      )}

      {target.apply_to === "specific_tags" && (
        <TagReferenceField
          kind="tag"
          label="Etiquetas"
          ids={target.tag_ids ?? []}
          onChangeIds={(ids) => onChange({ ...target, tag_ids: ids })}
        />
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
        Object.assign(base, { buy_qty: 2, get_qty: 1, discount_type: "percent", discount_percent: 100, discount_amount: 0, apply_to_cheapest: true, target: DEFAULT_TARGET });
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
            {action.type === "set_fixed_price" && (
              <div className="space-y-1">
                <Label className="text-xs">Cantidad máxima con precio fijo</Label>
                <Input
                  type="number"
                  className="w-[140px]"
                  placeholder="Sin límite"
                  value={action.max_qty ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : parseInt(e.target.value) || 1;
                    updateField("max_qty", val);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para aplicar a todas las unidades
                </p>
              </div>
            )}
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

      case "buy_x_get_y": {
        const discountType = action.discount_type ?? "percent";
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
                <Label className="text-xs">Tipo de descuento</Label>
                <Select
                  value={discountType}
                  onValueChange={(val) => updateField("discount_type", val as "percent" | "fixed")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo (S/)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType === "percent" ? (
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
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Monto dto. por unidad (S/)</Label>
                  <Input
                    type="number"
                    className="w-[140px]"
                    placeholder="Ej: 10.00"
                    value={action.discount_amount ?? 0}
                    onChange={(e) => updateField("discount_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ej: 2x1 = Comprar 2, llevar 1 al 100% dto. | 2da al 50% = Comprar 2, llevar 1 al 50% dto. | Monto fijo: resta S/ X a cada unidad con descuento.
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
      }

      case "free_gift":
        return (
          <div className="flex gap-2 items-end">
            <ProductReferenceField
              className="w-[280px]"
              mode="variation"
              multiple={false}
              label="Variación de regalo"
              ids={action.variation_id ? [action.variation_id] : []}
              onChangeIds={(ids) => updateField("variation_id", ids[0] ?? 0)}
            />
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
