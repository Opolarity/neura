import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import type { POSCartItem, POSCustomerData } from "../../types/POS.types";
import { formatCurrency } from "../../adapters/POS.adapter";

interface POSSummaryProps {
  cart: POSCartItem[];
  customer: POSCustomerData;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
}

export default function POSSummary({
  cart,
  customer,
  subtotal,
  discountAmount,
  shippingCost,
  total,
}: POSSummaryProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumen de Venta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
            <span className="font-medium">S/ {formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuentos</span>
              <span>- S/ {formatCurrency(discountAmount)}</span>
            </div>
          )}

          {shippingCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Costo de Envio</span>
              <span className="font-medium">S/ {formatCurrency(shippingCost)}</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between">
            <span className="text-blue-600 font-medium">TOTAL FINAL</span>
            <span className="text-2xl font-bold text-blue-600">
              S/ {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Selected customer */}
        {customer.customerName && (
          <div className="border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1">
                <User className="w-3 h-3" />
                CLIENTE SELECCIONADO
              </div>
              <div className="font-medium text-sm">
                {customer.customerName} {customer.customerLastname}
              </div>
              {customer.documentNumber && (
                <div className="text-xs text-gray-500">
                  Doc: {customer.documentNumber}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
