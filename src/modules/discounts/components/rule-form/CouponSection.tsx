import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import type { PriceRuleFormData } from "../../types/priceRule.types";
import { LabelRow, OptionalBadge } from "./OptionalBadge";

interface CouponSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

export const CouponSection = ({ formData, updateField }: CouponSectionProps) => {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="space-y-2">
        <Label htmlFor="coupon_code">Código del cupón</Label>
        <Input
          id="coupon_code"
          placeholder="Ej: VERANO2026"
          className="max-w-xs font-mono uppercase"
          value={formData.coupon_code}
          onChange={(e) => updateField("coupon_code", e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelRow>
            <Label htmlFor="max_uses">Usos máximos</Label>
            <OptionalBadge />
          </LabelRow>
          <Input
            id="max_uses"
            type="number"
            placeholder="Sin límite"
            value={formData.max_uses ?? ""}
            onChange={(e) =>
              updateField("max_uses", e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>
        <div className="space-y-2">
          <LabelRow>
            <Label htmlFor="max_uses_per_customer">Usos por cliente</Label>
            <OptionalBadge />
          </LabelRow>
          <Input
            id="max_uses_per_customer"
            type="number"
            placeholder="Sin límite"
            value={formData.max_uses_per_customer ?? ""}
            onChange={(e) =>
              updateField(
                "max_uses_per_customer",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
          />
        </div>
      </div>

      {/* S-186: la descripción solo se ve cuando el cupón ya está aplicado.
          Este texto se muestra antes, en el carrito del ecommerce, a los
          clientes que cumplen las condiciones de la regla. */}
      <div className="space-y-2">
        <LabelRow>
          <Label>Mensaje en el carrito</Label>
          <OptionalBadge />
        </LabelRow>
        {/* El label lo pinta LabelRow para llevar el badge: el del editor
            (solo acepta texto) se deja vacío. */}
        <WysiwygEditor
          label=""
          value={formData.cart_message}
          onChange={(val) => updateField("cart_message", val)}
          placeholder="Ej: Usa el código VERANO2026 al finalizar tu compra y obtén 8% de descuento"
          height="120px"
          toolbar="basic"
        />
        <p className="text-xs text-muted-foreground">
          Se muestra en el carrito mientras el cupón no está aplicado, a los
          clientes que cumplen las condiciones.
        </p>
      </div>
    </div>
  );
};
