import { ProductsByCategoryChart } from './ProductsByCategoryChart';
import { TopProductsChart } from './TopProductsChart';
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

      <ProductDetailSearch
        selectedProductId={dash.selectedProductId}
        selectedProductTitle={dash.selectedProductTitle}
        detail={dash.productDetail.data ?? null}
        detailLoading={dash.productDetail.isLoading}
      />
    </div>
  );
}
