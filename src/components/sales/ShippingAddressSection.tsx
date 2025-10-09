import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShippingAddressSectionProps {
  formData: any;
  salesData: any;
  onInputChange: (field: string, value: string) => void;
}

export const ShippingAddressSection: React.FC<ShippingAddressSectionProps> = ({
  formData,
  salesData,
  onInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dirección de Envío</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>País</Label>
          <Select value={formData.country_id} onValueChange={(v) => onInputChange('country_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.countries.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estado/Provincia</Label>
          <Select value={formData.state_id} onValueChange={(v) => onInputChange('state_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.states
                .filter((s: any) => !formData.country_id || s.country_id.toString() === formData.country_id)
                .map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ciudad</Label>
          <Select value={formData.city_id} onValueChange={(v) => onInputChange('city_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.cities
                .filter((c: any) => !formData.state_id || c.state_id.toString() === formData.state_id)
                .map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Barrio</Label>
          <Select value={formData.neighborhood_id} onValueChange={(v) => onInputChange('neighborhood_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.neighborhoods
                .filter((n: any) => !formData.city_id || n.city_id.toString() === formData.city_id)
                .map((n: any) => (
                  <SelectItem key={n.id} value={n.id.toString()}>
                    {n.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Dirección</Label>
          <Input value={formData.address} onChange={(e) => onInputChange('address', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Referencia</Label>
          <Input
            value={formData.address_reference}
            onChange={(e) => onInputChange('address_reference', e.target.value)}
          />
        </div>
        <div>
          <Label>Persona que Recibe</Label>
          <Input
            value={formData.reception_person}
            onChange={(e) => onInputChange('reception_person', e.target.value)}
          />
        </div>
        <div>
          <Label>Teléfono de Recepción</Label>
          <Input
            value={formData.reception_phone}
            onChange={(e) => onInputChange('reception_phone', e.target.value)}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};
