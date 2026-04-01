import { Card, Title, BarChart, Select, SelectItem } from '@tremor/react';
import type { SalesByDimensionItem, SalesDimension } from '../../types/reports.types';

interface Props {
  data: SalesByDimensionItem[];
  loading: boolean;
  dimension: SalesDimension;
  onDimensionChange: (d: SalesDimension) => void;
}

const DIMENSION_LABELS: Record<SalesDimension, string> = {
  branch: 'Sucursal',
  sale_type: 'Tipo de comprobante',
  payment_method: 'Método de pago',
  situation: 'Estado de pedido',
  state: 'Departamento',
  city: 'Ciudad',
  neighborhood: 'Distrito',
};

export function SalesByDimensionChart({ data, loading, dimension, onDimensionChange }: Props) {
  const chartData = data.map((d) => ({
    Dimensión: d.label,
    'Ventas (S/)': d.total_revenue,
    'Pedidos': d.order_count,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>Ventas por {DIMENSION_LABELS[dimension]}</Title>
        <Select
          value={dimension}
          onValueChange={(v) => onDimensionChange(v as SalesDimension)}
          className="w-52"
        >
          {(Object.entries(DIMENSION_LABELS) as [SalesDimension, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </Select>
      </div>
      {loading ? (
        <div className="h-52 bg-muted animate-pulse rounded" />
      ) : (
        <BarChart
          data={chartData}
          index="Dimensión"
          categories={['Ventas (S/)']}
          colors={['blue']}
          valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
          layout="vertical"
          className="h-52"
        />
      )}
    </Card>
  );
}
