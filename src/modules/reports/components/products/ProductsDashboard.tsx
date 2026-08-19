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
  return (
    <div className="space-y-6">
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
        selectedProductId={dash.appliedProductId}
        selectedProductTitle={dash.appliedProductTitle}
        detail={dash.productDetail.data ?? null}
        detailLoading={dash.productDetail.isLoading}
      />
    </div>
  );
}
