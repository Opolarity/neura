import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Search, Loader2, CheckCircle, XCircle, Truck, ShoppingCart } from "lucide-react";
import type { POSCustomerData, POSCartItem } from "../../../types/POS.types";
import type { DocumentType } from "../../../types";
import { formatCurrency } from "../../../adapters/POS.adapter";

interface CustomerDataStepProps {
  customer: POSCustomerData;
  documentTypes: DocumentType[];
  clientFound: boolean | null;
  searchingClient: boolean;
  onUpdateCustomer: (field: keyof POSCustomerData, value: string | boolean) => void;
  onSearchClient: () => void;
  cart: POSCartItem[];
  total: number;
}

export default function CustomerDataStep({
  customer,
  documentTypes,
  clientFound,
  searchingClient,
  onUpdateCustomer,
  onSearchClient,
  cart,
  total,
}: CustomerDataStepProps) {
  const selectedDocType = documentTypes.find(
    (dt) => dt.id.toString() === customer.documentTypeId
  );
  const isCompany = selectedDocType?.personType === 2;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Datos del Cliente</h2>
      </div>

      {/* Resumen de productos */}
      {cart.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Resumen del pedido ({cart.length} {cart.length === 1 ? "producto" : "productos"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cart.map((item) => (
              <div
                key={`${item.variationId}-${item.stockTypeId}`}
                className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">{item.variationName} × {item.quantity}</span>
                </div>
                <span className="font-medium ml-3 whitespace-nowrap">
                  S/ {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-base font-bold">S/ {formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document search row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={customer.documentTypeId}
                onValueChange={(value) => onUpdateCustomer("documentTypeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Numero de Documento</Label>
              <div className="flex gap-2">
                <Input
                  value={customer.documentNumber}
                  onChange={(e) =>
                    onUpdateCustomer("documentNumber", e.target.value)
                  }
                  placeholder="Ingrese numero..."
                />
                <Button
                  variant="outline"
                  onClick={onSearchClient}
                  disabled={
                    !customer.documentTypeId ||
                    !customer.documentNumber ||
                    searchingClient
                  }
                >
                  {searchingClient ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              {clientFound === true && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Cliente encontrado
                </div>
              )}
              {clientFound === false && (
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  No encontrado
                </div>
              )}
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{isCompany ? "Razon Social" : "Nombres"}</Label>
              <Input
                value={customer.customerName}
                onChange={(e) => onUpdateCustomer("customerName", e.target.value)}
                placeholder={isCompany ? "Razon social..." : "Nombres..."}
              />
            </div>

            {!isCompany && (
              <>
                <div className="space-y-2">
                  <Label>Apellido Paterno</Label>
                  <Input
                    value={customer.customerLastname}
                    onChange={(e) =>
                      onUpdateCustomer("customerLastname", e.target.value)
                    }
                    placeholder="Apellido paterno..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apellido Materno</Label>
                  <Input
                    value={customer.customerLastname2}
                    onChange={(e) =>
                      onUpdateCustomer("customerLastname2", e.target.value)
                    }
                    placeholder="Apellido materno..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Contact fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Email <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => onUpdateCustomer("email", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Telefono <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                value={customer.phone}
                onChange={(e) => onUpdateCustomer("phone", e.target.value)}
                placeholder="+51 999 999 999"
              />
            </div>
          </div>

          {/* Shipping checkbox */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="requiresShipping"
                checked={customer.requiresShipping}
                onCheckedChange={(checked) =>
                  onUpdateCustomer("requiresShipping", checked === true)
                }
              />
              <div>
                <Label
                  htmlFor="requiresShipping"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  Incluye envio a domicilio
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Marque esta opcion si el pedido requiere despacho a una direccion
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
