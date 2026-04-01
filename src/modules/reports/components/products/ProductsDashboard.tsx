import { Grid, Col } from '@tremor/react';
import { ProductsByCategoryChart } from './ProductsByCategoryChart';
import { TopProductsChart } from './TopProductsChart';
import { ProductDetailSearch } from './ProductDetailSearch';
import { useProductsDashboard } from '../../hooks/useProductsDashboard';
import type { ReportsFilters } from '../../types/reports.types';

interface ProductsDashboardProps {
  filters: ReportsFilters;
}

export function ProductsDashboard({ filters }: ProductsDashboardProps) {
  const dash = useProductsDashboard(filters);

  return (
    <div className="space-y-6">
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Col>
          <ProductsByCategoryChart
            data={dash.byCategory.data ?? []}
            loading={dash.byCategory.isLoading}
          />
        </Col>
        <Col>
          <TopProductsChart
            data={dash.topByCategory.data ?? []}
            loading={dash.topByCategory.isLoading}
            limit={dash.topLimit}
            onLimitChange={dash.setTopLimit}
            categoryId={dash.selectedCategoryId}
            categories={dash.byCategory.data ?? []}
            onCategoryChange={dash.setSelectedCategoryId}
          />
        </Col>
      </Grid>

      <ProductDetailSearch
        searchQuery={dash.productSearch}
        onSearchChange={dash.setProductSearch}
        searchResults={dash.searchResults.data ?? []}
        selectedProductId={dash.selectedProductId}
        onSelectProduct={dash.setSelectedProductId}
        detail={dash.productDetail.data ?? null}
        detailLoading={dash.productDetail.isLoading}
      />
    </div>
  );
}
