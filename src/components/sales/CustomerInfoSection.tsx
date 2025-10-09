import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerInfoSectionProps {
  formData: any;
  salesData: any;
  onInputChange: (field: string, value: string) => void;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  formData,
  salesData,
  onInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Fecha</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => onInputChange('date', e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Tipo de Documento</Label>
          <Select value={formData.document_type} onValueChange={(v) => onInputChange('document_type', v)} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.documentTypes.map((dt: any) => (
                <SelectItem key={dt.id} value={dt.id.toString()}>
                  {dt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Número de Documento</Label>
          <Input
            value={formData.document_number}
            onChange={(e) => onInputChange('document_number', e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input
            value={formData.customer_name}
            onChange={(e) => onInputChange('customer_name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Apellido</Label>
          <Input
            value={formData.customer_lastname}
            onChange={(e) => onInputChange('customer_lastname', e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
          />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};
