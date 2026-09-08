import { Suspense, lazy, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { filterOptionsService } from '../services/reports.service';
import { defaultProductSituationIds, isSameIdSet } from '../types/reports.types';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ProductsOptionsPanel } from '../components/products/ProductsOptionsPanel';
import { useProductsDashboard } from '../hooks/useProductsDashboard';
import {
  generateProductsReportExcel,
  type ProductExportRow,
  type CategoryExportRow,
} from '../utils/generateProductsReportExcel';
import { toastError } from '@/shared/utils/toastError';

const ProductsDashboard = lazy(() =>
  import('../components/products/ProductsDashboard').then((m) => ({ default: m.ProductsDashboard })),
);

export default function ProductsPage() {
  const { filters, draft, applyImmediate, applyVersion } = useReportsFilters();
  const dash = useProductsDashboard(filters, applyVersion);
  const [isExporting, setIsExporting] = useState(false);

  // El catálogo ya está cacheado por el filtro de situación; se lee aquí para
  // saber si la selección difiere del default (badge) y para resolver las
  // situaciones que viajan al Excel.
  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  const situationIsDefault =
    draft.productSituationIds === null ||
    isSameIdSet(draft.productSituationIds, defaultProductSituationIds(situations.data ?? []));

  const extraActiveCount =
    [
      dash.selectedProductId,
      draft.branchId,
      draft.saleTypeId,
      draft.countryId,
      draft.stateId,
      draft.cityId,
      draft.neighborhoodId,
      draft.paymentMethodId,
      draft.priceListCode,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    dash.selectProduct(null);
    applyImmediate({
      ...draft,
      branchId: null,
      saleTypeId: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      paymentMethodId: null,
      priceListCode: null,
      productSituationIds: null,
    });
  }

  // Las situaciones del export salen de `filters`, no de `draft`: el Excel tiene
  // que cubrir lo aplicado, no lo que el usuario esté tipeando en los filtros.
  const exportSituationIds = useMemo(
    () => filters.productSituationIds ?? defaultProductSituationIds(situations.data ?? []),
    [filters.productSituationIds, situations.data],
  );

  /**
   * Con el catálogo sin resolver, `defaultProductSituationIds([])` devuelve [] y
   * los SP con `p_situation_ids` en array vacío no matchean ninguna orden: el
   * export terminaba avisando "no hay datos para el rango", que diagnostica mal.
   */
  const situationsReady = filters.productSituationIds !== null || situations.isSuccess;

  // El Excel no abre ningún diálogo: usa el rango y los filtros ya aplicados en
  // la barra, igual que la descarga de Ventas. Las dos hojas se piden en
  // paralelo porque son independientes y comparten los mismos filtros.
  async function handleDownload() {
    if (!filters.startDate || !filters.endDate) {
      toast({ title: 'Elegí un rango de fechas en los filtros antes de exportar', variant: 'warning' });
      return;
    }
    if (!situationsReady) {
      toast({
        title: situations.isError
          ? 'No se pudo cargar el catálogo de estados de pedido. Recargá la página e intentá de nuevo.'
          : 'Cargando estados de pedido, probá de nuevo en un momento.',
        variant: 'warning',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Mismo criterio que los gráficos, para que el Excel no contradiga a la
      // pantalla: hasta la migración 31000908124100 estos SP solo aceptaban
      // fecha y situación, así que el archivo salía sin filtrar por sede ni
      // canal — con sede = Gamarra la pantalla mostraba 637.00 y el Excel
      // exportaba 5816.25.
      const scope = {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_branch_id: filters.branchId ?? undefined,
        p_sale_type_id: filters.saleTypeId ?? undefined,
        p_country_id: filters.countryId ?? undefined,
        p_state_id: filters.stateId ?? undefined,
        p_city_id: filters.cityId ?? undefined,
        p_neighborhood_id: filters.neighborhoodId ?? undefined,
        p_payment_method_id: filters.paymentMethodId ?? undefined,
        p_price_list_code: filters.priceListCode ?? undefined,
        p_situation_ids: exportSituationIds,
      };

      const [resProducts, resCategories] = await Promise.all([
        supabase.rpc('sp_rpt_export_products_by_product', scope),
        supabase.rpc('sp_rpt_export_products_by_category', scope),
      ]);

      if (resProducts.error) throw resProducts.error;
      if (resCategories.error) throw resCategories.error;

      const byProduct: ProductExportRow[] = resProducts.data ?? [];
      const byCategory: CategoryExportRow[] = resCategories.data ?? [];

      if (byProduct.length === 0 && byCategory.length === 0) {
        toast({ title: 'No hay datos para el rango seleccionado', variant: 'warning' });
        return;
      }

      generateProductsReportExcel(byProduct, byCategory, filters.startDate, filters.endDate);
      toast({ title: `Reporte exportado: ${byProduct.length} productos`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de productos</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        extraFields={<ProductsOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        extraDirty={dash.isProductDirty}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            Productos mide <strong className="font-medium text-foreground">mercadería que salió
            del almacén</strong>: por defecto solo cuenta los pedidos Enviado y Entregado. Los
            que están En proceso o Armado no entran acá, pero sí en Reportes de ventas, que mide
            lo que se pidió — por eso las dos pestañas no dan el mismo volumen; para cambiar el
            criterio, usá el filtro Estado de pedido.{' '}
            <strong className="font-medium text-foreground">Ingresos</strong> valoriza solo las
            líneas de producto (unidades × precio, menos descuento): no incluye el flete ni otros
            conceptos del pedido, y es lo que valía la mercadería, no lo que se cobró.
          </>
        }
        exportSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? 'Generando...' : 'Descargar'}
          </Button>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <ProductsDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
