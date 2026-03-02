import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ShoppingBag, User } from "lucide-react";
import type { POSCartItem, POSCustomerData } from "../../types/POS.types";
import { formatCurrency } from "../../adapters/POS.adapter";

interface POSSummaryProps {
  cart: POSCartItem[];
  customer: POSCustomerData;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  showProducts?: boolean;
}

export default function POSSummary({
  cart,
  customer,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  showProducts = false
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
          <span className="text-lg font-bold text-primary">
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

          {discountAmount > 0 &&
          <div className="flex justify-between text-green-600">
              <span>Descuentos</span>
              <span>- S/ {formatCurrency(discountAmount)}</span>
            </div>
          }

          {shippingCost > 0 &&
          <div className="flex justify-between">
              <span className="text-muted-foreground">Costo de Envío</span>
              <span className="font-medium">S/ {formatCurrency(shippingCost)}</span>
            </div>
          }

          <div className="border-t pt-2 flex justify-between">
            <span className="text-primary font-medium">TOTAL FINAL</span>
            <span className="text-2xl font-bold text-primary">
              S/ {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Product list */}
        {showProducts && cart.length > 0 &&
        <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <ShoppingBag className="w-3 h-3" />
              PRODUCTOS
            </div>
            {cart.map((item) =>
          <div
            key={item.variationId}
            className="flex justify-between items-start text-sm border-b last:border-b-0 pb-2 last:pb-0">

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.variationName} × {item.quantity}</p>
                </div>
                <span className="text-xs font-medium ml-2 whitespace-nowrap">
                  S/ {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
          )}
          </div>
        }

        {/* Selected customer */}
        {customer.customerName &&
        <div className="border-t pt-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
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
                    <div className="truncate font-medium text-xs">{item.productName}</div>
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