import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, User, Phone, FileText } from "lucide-react";
import type { POSShippingData } from "../../../types/POS.types";
import type { Country, State, City, Neighborhood, ShippingCost } from "../../../types";
import { formatCurrency } from "../../../adapters/POS.adapter";

interface ShippingStepProps {
  shipping: POSShippingData;
  countries: Country[];
  states: State[];
  cities: City[];
  neighborhoods: Neighborhood[];
  shippingCosts: ShippingCost[];
  onUpdateShipping: (field: keyof POSShippingData, value: string | number) => void;
}

export default function ShippingStep({
  shipping,
  countries,
  states,
  cities,
  neighborhoods,
  shippingCosts,
  onUpdateShipping,
}: ShippingStepProps) {
  // Filter location options based on parent selection
  const filteredStates = states.filter(
    (s) => s.countryId === parseInt(shipping.countryId)
  );
  const filteredCities = cities.filter(
    (c) => c.stateId === parseInt(shipping.stateId)
  );
  const filteredNeighborhoods = neighborhoods.filter(
    (n) => n.cityId === parseInt(shipping.cityId)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold">Detalles de Despacho</h2>
      </div>
      <p className="text-gray-500 text-sm -mt-4">
        Seleccione el metodo y la direccion para la entrega del pedido.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Direccion de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location selects */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pais</Label>
              <Select
                value={shipping.countryId}
                onValueChange={(value) => onUpdateShipping("countryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione pais..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departamento / Estado</Label>
              <Select
                value={shipping.stateId}
                onValueChange={(value) => onUpdateShipping("stateId", value)}
                disabled={!shipping.countryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredStates.map((state) => (
                    <SelectItem key={state.id} value={state.id.toString()}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ciudad / Provincia</Label>
              <Select
                value={shipping.cityId}
                onValueChange={(value) => onUpdateShipping("cityId", value)}
                disabled={!shipping.stateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Distrito / Barrio</Label>
              <Select
                value={shipping.neighborhoodId}
                onValueChange={(value) => onUpdateShipping("neighborhoodId", value)}
                disabled={!shipping.cityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredNeighborhoods.map((neighborhood) => (
                    <SelectItem
                      key={neighborhood.id}
                      value={neighborhood.id.toString()}
                    >
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Direccion completa
            </Label>
            <Input
              value={shipping.address}
              onChange={(e) => onUpdateShipping("address", e.target.value)}
              placeholder="Calle, numero, edificio, piso, etc."
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Referencia
            </Label>
            <Textarea
              value={shipping.addressReference}
              onChange={(e) => onUpdateShipping("addressReference", e.target.value)}
              placeholder="Cerca de..., frente a..., etc."
              rows={2}
            />
          </div>

          {/* Contact person */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre del Destinatario
              </Label>
              <Input
                value={shipping.receptionPerson}
                onChange={(e) =>
                  onUpdateShipping("receptionPerson", e.target.value)
                }
                placeholder="Quien recibira el pedido..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefono de Contacto
              </Label>
              <Input
                value={shipping.receptionPhone}
                onChange={(e) => onUpdateShipping("receptionPhone", e.target.value)}
                placeholder="+51 999 999 999"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping method selection */}
      {shippingCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metodo de Envio</CardTitle>
            <CardDescription>Seleccione el metodo de envio disponible para esta ubicacion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {shippingCosts.map((cost) => (
                <div
                  key={cost.id}
                  onClick={() => {
                    onUpdateShipping("shippingMethodId", cost.shippingMethodId.toString());
                    onUpdateShipping("shippingCost", cost.cost);
                  }}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    shipping.shippingMethodId === cost.shippingMethodId.toString()
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{cost.name}</div>
                    </div>
                    <Badge variant="secondary">
                      S/ {formatCurrency(cost.cost)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
