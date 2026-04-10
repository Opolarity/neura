import { Title, BarChart, Grid, Col } from '@tremor/react';
import { Card } from '@/components/ui/card';
import type { GeoDistributionData } from '../../types/reports.types';

interface Props {
  data: GeoDistributionData | null;
  loading: boolean;
}

export function CustomersGeoChart({ data, loading }: Props) {
  const stateData = (data?.by_state ?? []).slice(0, 10).map((d) => ({
    Departamento: d.state_name,
    'Compradores': d.unique_buyers,
    'Pedidos': d.order_count,
  }));

  const cityData = (data?.by_city ?? []).slice(0, 10).map((d) => ({
    Ciudad: d.city_name,
    'Compradores': d.unique_buyers,
    'Pedidos': d.order_count,
  }));

  return (
    <Card className='h-full p-4'>
      <Title className="mb-4">Distribución geográfica de clientes</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded" />
      ) : (
        <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
          <Col>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por departamento (top 10)</p>
            <BarChart
              data={stateData}
              index="Departamento"
              categories={['Compradores']}
              colors={['blue']}
              layout="vertical"
              className="h-48"
            />
          </Col>
          <Col>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por ciudad (top 10)</p>
            <BarChart
              data={cityData}
              index="Ciudad"
              categories={['Compradores']}
              colors={['blue']}
              layout="vertical"
              className="h-48"
            />
          </Col>
        </Grid>
      )}
    </Card>
  );
}
