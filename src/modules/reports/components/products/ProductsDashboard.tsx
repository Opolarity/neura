import { KpiCard } from '../shared/KpiCard';
import { formatCurrency } from '@/shared/utils/currency';
import { ProductsByCategoryChart } from './ProductsByCategoryChart';
import { TopProductsChart } from './TopProductsChart';
import { ProductsParetoChart } from './ProductsParetoChart';
import { MarginVolumeScatter } from './MarginVolumeScatter';
import { CategoryOverTimeChart } from './CategoryOverTimeChart';
import { SizeCategoryHeatmap } from './SizeCategoryHeatmap';
import { ProductDetailSearch } from './ProductDetailSearch';
import type { ProductsDashboardState } from '../../hooks/useProductsDashboard';

interface ProductsDashboardProps {
  dash: ProductsDashboardState;
}

export function ProductsDashboard({ dash }: ProductsDashboardProps) {
  const kpis = dash.kpis.data;

  return (
    <div className="space-y-6">
      {/*
        Estas tarjetas cuentan cada producto una sola vez, así que NO coinciden
        con la suma de los gráficos por categoría de más abajo — esos atribuyen
        el producto entero a cada una de sus categorías (ver MultiCategoryNotice).
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Unidades Vendidas"
          value={kpis ? kpis.total_quantity.toLocaleString('es-PE') : '—'}
          loading={dash.kpis.isLoading}
          subtitle="mercadería que salió del almacén"
        />
        <KpiCard
          title="Ingresos"
          value={kpis ? formatCurrency(kpis.total_revenue) : '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Productos con Venta"
          value={kpis ? kpis.products_with_sales : '—'}
          loading={dash.kpis.isLoading}
          subtitle={kpis ? `en ${kpis.orders_count} pedidos` : undefined}
        />
        <KpiCard
          title="Precio Promedio"
          value={kpis ? formatCurrency(kpis.avg_unit_price) : '—'}
          loading={dash.kpis.isLoading}
          subtitle="por unidad vendida"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProductsByCategoryChart
          data={dash.byCategory.data ?? []}
          loading={dash.byCategory.isLoading}
        />
        <TopProductsChart
          data={dash.topByCategory.data ?? []}
          loading={dash.topByCategory.isLoading}
          limit={dash.topLimit}
          onLimitChange={dash.setTopLimit}
          categoryId={dash.selectedCategoryId}
          categories={dash.byCategory.data ?? []}
          onCategoryChange={dash.setSelectedCategoryId}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProductsParetoChart
          data={dash.pareto.data ?? []}
          loading={dash.pareto.isLoading}
          limit={dash.paretoLimit}
          onLimitChange={dash.setParetoLimit}
        />
        <MarginVolumeScatter
          data={dash.marginScatter.data ?? []}
          loading={dash.marginScatter.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryOverTimeChart
          data={dash.categoryOverTime.data ?? []}
          loading={dash.categoryOverTime.isLoading}
          granularity={dash.categoryGranularity}
          onGranularityChange={dash.setCategoryGranularity}
        />
        <SizeCategoryHeatmap
          data={dash.salesBySize.data ?? []}
          loading={dash.salesBySize.isLoading}
        />
      </div>

      <ProductDetailSearch
        dash={dash}
        selectedProductId={dash.appliedProductId}
        selectedProductTitle={dash.appliedProductTitle}
        detail={dash.productDetail.data ?? null}
        detailLoading={dash.productDetail.isLoading}
      />
    </div>
  );
}
