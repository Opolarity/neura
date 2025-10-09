import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentSectionProps {
  salesData: any;
  paymentMethod: string;
  paymentAmount: string;
  confirmationCode: string;
  total: number;
  onPaymentMethodChange: (value: string) => void;
  onPaymentAmountChange: (value: string) => void;
  onConfirmationCodeChange: (value: string) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  salesData,
  paymentMethod,
  paymentAmount,
  confirmationCode,
  total,
  onPaymentMethodChange,
  onPaymentAmountChange,
  onConfirmationCodeChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Pago (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Método de Pago</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {salesData?.paymentMethods.map((pm: any) => (
                <SelectItem key={pm.id} value={pm.id.toString()}>
                  {pm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Monto Pagado</Label>
          <Input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange(e.target.value)}
            placeholder={total.toFixed(2)}
            onWheel={(e) => e.currentTarget.blur()}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div>
          <Label>Código de Confirmación</Label>
          <Input
            value={confirmationCode}
            onChange={(e) => onConfirmationCodeChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
