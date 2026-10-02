import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import type { PriceRuleFormData } from "../../types/priceRule.types";

interface CouponSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

export const CouponSection = ({ formData, updateField }: CouponSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cupón</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coupon_code">Código de cupón *</Label>
          <Input
            id="coupon_code"
            placeholder="Ej: VERANO2026"
            value={formData.coupon_code}
            onChange={(e) => updateField("coupon_code", e.target.value.toUpperCase())}
          />
          <p className="text-xs text-muted-foreground">
            El código que el cliente ingresará para aplicar el descuento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_uses">Máximo de usos totales</Label>
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
            <Label htmlFor="max_uses_per_customer">Máximo por cliente</Label>
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
          <WysiwygEditor
            label="Mensaje en el carrito"
            value={formData.cart_message}
            onChange={(val) => updateField("cart_message", val)}
            placeholder="Ej: Usa el código VERANO2026 al finalizar tu compra y obtén 8% de descuento"
            height="120px"
            toolbar="basic"
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Se muestra en el carrito mientras el cupón no está
            aplicado, solo a los clientes que cumplen las condiciones de la
            regla. Una vez aplicado, se muestra la descripción.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
