import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Banknote,
  Building,
  Plus,
  Trash2,
  ShoppingBag,
  User,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import type { POSCartItem, POSPayment, POSCustomerData } from "../../../types/POS.types";
import type { PaymentMethod } from "../../../types";
import { formatCurrency } from "../../../adapters/POS.adapter";

interface PaymentStepProps {
  customer: POSCustomerData;
  cart: POSCartItem[];
  payments: POSPayment[];
  currentPayment: POSPayment;
  paymentMethods: PaymentMethod[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  totalPaid: number;
  changeAmount: number;
  onUpdateCurrentPayment: (field: keyof POSPayment, value: string | number) => void;
  onAddPayment: () => void;
  onRemovePayment: (id: string) => void;
}

export default function PaymentStep({
  customer,
  cart,
  payments,
  currentPayment,
  paymentMethods,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  totalPaid,
  changeAmount,
  onUpdateCurrentPayment,
  onAddPayment,
  onRemovePayment,
}: PaymentStepProps) {
  const pendingAmount = Math.max(0, total - totalPaid);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick amount buttons
  const quickAmounts = [
    { label: `S/ ${formatCurrency(total)} (Exacto)`, value: total },
    { label: `S/ ${formatCurrency(Math.ceil(total / 10) * 10)}`, value: Math.ceil(total / 10) * 10 },
    { label: `S/ ${formatCurrency(Math.ceil(total / 50) * 50)}`, value: Math.ceil(total / 50) * 50 },
  ];

  const getPaymentIcon = (methodName: string) => {
    const name = methodName.toLowerCase();
    if (name.includes("efectivo") || name.includes("cash")) {
      return <Banknote className="w-5 h-5" />;
    }
    if (name.includes("tarjeta") || name.includes("card")) {
      return <CreditCard className="w-5 h-5" />;
    }
    return <Building className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold">Resumen y Pago</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column - Payment */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Metodo de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment method buttons */}
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.slice(0, 3).map((method) => (
                  <Button
                    key={method.id}
                    variant={
                      currentPayment.paymentMethodId === method.id.toString()
                        ? "default"
                        : "outline"
                    }
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    onClick={() =>
                      onUpdateCurrentPayment("paymentMethodId", method.id.toString())
                    }
                  >
                    {getPaymentIcon(method.name)}
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
              </div>

              {/* More payment methods */}
              {paymentMethods.length > 3 && (
                <Select
                  value={currentPayment.paymentMethodId}
                  onValueChange={(value) =>
                    onUpdateCurrentPayment("paymentMethodId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Otros metodos de pago..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Amount input */}
              <div className="space-y-2">
                <Label>Monto Recibido</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    S/
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentPayment.amount || ""}
                    onChange={(e) =>
                      onUpdateCurrentPayment(
                        "amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="pl-10 text-xl font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((qa, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onUpdateCurrentPayment("amount", qa.value)}
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>

              {/* Confirmation code (for non-cash) */}
              {currentPayment.paymentMethodId &&
                !paymentMethods
                  .find((pm) => pm.id.toString() === currentPayment.paymentMethodId)
                  ?.name.toLowerCase()
                  .includes("efectivo") && (
                  <div className="space-y-2">
                    <Label>Codigo de Confirmacion</Label>
                    <Input
                      value={currentPayment.confirmationCode}
                      onChange={(e) =>
                        onUpdateCurrentPayment("confirmationCode", e.target.value)
                      }
                      placeholder="Numero de operacion..."
                    />
                  </div>
                )}

              {/* Add payment button */}
              <Button
                onClick={onAddPayment}
                disabled={!currentPayment.paymentMethodId || currentPayment.amount <= 0}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Pago
              </Button>

              {/* Payments list */}
              {payments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pagos registrados:</Label>
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {payment.paymentMethodName ||
                            paymentMethods.find(
                              (pm) => pm.id.toString() === payment.paymentMethodId
                            )?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          S/ {formatCurrency(payment.amount)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => onRemovePayment(payment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Change to give */}
              {changeAmount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    VUELTO A ENTREGAR
                  </div>
                  <div className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                    S/ {formatCurrency(changeAmount)}
                    <RefreshCw className="w-6 h-6" />
                  </div>
                </div>
              )}

              {/* Pending amount */}
              {pendingAmount > 0 && totalPaid > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-xs text-orange-600 font-medium mb-1">
                    MONTO PENDIENTE
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    S/ {formatCurrency(pendingAmount)}
                  </div>
                </div>
              )}

              {/* Ready indicator */}
              {totalPaid >= total && (
                <div className="flex items-center gap-2 text-green-600 justify-center p-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Listo para completar venta</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Sale Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
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
                    <span className="text-muted-foreground">Costo de Envio</span>
                    <span className="font-medium">S/ {formatCurrency(shippingCost)}</span>
                  </div>
                )}

                <div className="border-t pt-2 flex justify-between">
                  <span className="text-primary font-medium">TOTAL FINAL</span>
                  <span className="text-2xl font-bold text-primary">
                    S/ {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Product list */}
              {cart.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <ShoppingBag className="w-3 h-3" />
                    PRODUCTOS
                  </div>
                  {cart.map((item) => (
                    <div
                      key={item.variationId}
                      className="flex justify-between items-start text-sm border-b last:border-b-0 pb-2 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.variationName} × {item.quantity}</p>
                      </div>
                      <span className="text-xs font-medium ml-2 whitespace-nowrap">
                        S/ {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected customer */}
              {customer.customerName && (
                <div className="border-t pt-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
                      <User className="w-3 h-3" />
                      CLIENTE SELECCIONADO
                    </div>
                    <div className="font-medium text-sm">
                      {customer.customerName} {customer.customerLastname}
                    </div>
                    {customer.documentNumber && (
                      <div className="text-xs text-muted-foreground">
                        Doc: {customer.documentNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
