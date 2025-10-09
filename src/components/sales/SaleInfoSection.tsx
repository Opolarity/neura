import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaleInfoSectionProps {
  formData: any;
  salesData: any;
  onInputChange: (field: string, value: string) => void;
}

export const SaleInfoSection: React.FC<SaleInfoSectionProps> = ({
  formData,
  salesData,
  onInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Venta</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Venta</Label>
          <Select value={formData.sale_type} onValueChange={(v) => onInputChange('sale_type', v)} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.saleTypes.map((st: any) => (
                <SelectItem key={st.id} value={st.id.toString()}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Método de Envío</Label>
          <Select value={formData.shipping_method} onValueChange={(v) => onInputChange('shipping_method', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.shippingMethods.map((sm: any) => (
                <SelectItem key={sm.id} value={sm.id.toString()}>
                  {sm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
