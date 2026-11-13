import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, User } from "lucide-react";
import type { POSCartItem, POSCustomerData } from "../../types/POS.types";
import { formatCurrency } from "../../adapters/POS.adapter";
import type { OrderDiscountRule, RuleApplication } from "../../rules/applyPriceRules";
import { shippingRuleName, type ShippingRule } from "../../rules/shippingRule";
import { ruleApplicationLabel, ruleSavingKey } from "../../rules/ruleSavings";

interface POSSummaryProps {
  cart: POSCartItem[];
  customer: POSCustomerData;
  subtotal: number;
  discountAmount: number;
  ruleDiscounts: OrderDiscountRule[];
  shippingRule: ShippingRule | null;
  /** T-1158: cada vez que se aplicó cada regla (lo de las que guardan 0 ya está en los precios). */
  ruleApplications: Map<string, RuleApplication[]>;
  shippingCost: number;
  total: number;

}

export default function POSSummary({
  cart,
  customer,
  subtotal,
  discountAmount,
  ruleDiscounts,
  shippingRule,
  ruleApplications,
  shippingCost,
  total
}: POSSummaryProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="w-96 flex-shrink-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Resumen ({itemCount} {itemCount === 1 ? "item" : "items"})
          </CardTitle>
          {cart.length > 0 &&
          <span className="text-lg font-bold">
              S/ {formatCurrency(total)}
            </span>
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">S/ {formatCurrency(subtotal)}</span>
          </div>

          {ruleDiscounts.map((r, i) => {
            // Monto 0 = el descuento ya viene aplicado al precio de cada línea (o al envío);
            // debajo se lista cada vez que se aplicó (T-1158).
            const applications =
              r.discount_amount === 0 ? ruleApplications.get(ruleSavingKey(r.name)) ?? [] : [];
            const includedIn =
              applications.some((a) => a.kind === "shipping") || r.name === shippingRuleName(shippingRule)
                ? "Inc. en envío"
                : "Inc. en productos";
            return (
              <div key={`${r.code}-${r.name}-${i}`} className="flex flex-col text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate max-w-[200px]">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r.discount_amount !== 0 ?
                    `${r.discount_amount > 0 ? "+" : "-"} S/ ${formatCurrency(Math.abs(r.discount_amount))}` :
                    includedIn}
                  </span>
                </div>
                {applications.length > 0 &&
                <ul className="ml-1 mt-0.5 flex flex-col gap-0.5 border-l pl-2 text-muted-foreground">
                    {applications.map((a, j) =>
                  <li key={j} className="flex justify-between gap-2">
                        <span>{ruleApplicationLabel(a)}</span>
                        <span className="shrink-0">
                          {`${a.discount_amount > 0 ? "-" : "+"} S/ ${formatCurrency(Math.abs(a.discount_amount))}`}
                        </span>
                      </li>
                  )}
                  </ul>
                }
              </div>);
          })}

          {discountAmount !== 0 &&
          <div className="flex justify-between">
              <span className="text-muted-foreground">Descuentos</span>
              <span className="font-medium">
                {discountAmount > 0 ? "+" : "-"} S/ {formatCurrency(Math.abs(discountAmount))}
              </span>
            </div>
          }

          {shippingCost > 0 &&
          <div className="flex justify-between">
              <span className="text-muted-foreground">Costo de Envío</span>
              <span className="font-medium">S/ {formatCurrency(shippingCost)}</span>
            </div>
          }

          <div className="border-t pt-2 flex justify-between">
            <span className="font-medium">TOTAL FINAL</span>
            <span className="text-2xl font-bold">
              S/ {formatCurrency(total)}
            </span>
          </div>
        </div>


        {/* Selected customer */}
        {customer.customerName &&
        <div className="border-t pt-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-medium mb-1">
                <User className="w-3 h-3" />
                CLIENTE SELECCIONADO
              </div>
              <div className="font-medium text-sm">
                {customer.customerName} {customer.customerLastname}
              </div>
              {customer.documentNumber &&
            <div className="text-xs text-muted-foreground">
                  Doc: {customer.documentNumber}
                </div>
            }
            </div>
          </div>
        }

        {/* Cart items */}
        {cart.length > 0 &&
        <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">PRODUCTOS</div>
            <div className="space-y-2 max-h-60 overflow-auto">
              {cart.map((item) =>
            <div
              key={`${item.variationId}-${item.stockTypeId}`}
              className="flex items-center justify-between text-sm">

                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-xs">
                      {item.productName}
                      {item.variationName ? ` (${item.variationName})` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} x S/ {formatCurrency(item.price)}
                    </div>
                  </div>
                  <span className="font-medium text-xs ml-2">
                    S/ {formatCurrency(item.quantity * item.price)}
                  </span>
                </div>
            )}
            </div>
          </div>
        }
      </CardContent>
    </Card>);

}