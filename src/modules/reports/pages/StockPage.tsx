import { Suspense, lazy, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { InventoryOptionsPanel } from '../components/inventory/InventoryOptionsPanel';
import { useInventoryDashboard } from '../hooks/useInventoryDashboard';
import { fetchInventoryReport, inventoryService } from '../services/reports.service';
import { generateInventoryReportExcel } from '../utils/generateInventoryReportExcel';
import { getTodayDate } from '@/shared/utils/date';
import { toastError } from '@/shared/utils/toastError';
import { ReportGuideSheet } from '../components/shared/ReportGuideSheet';
import { inventoryGuide } from '../guides/reportGuides';

const InventoryDashboard = lazy(() =>
  import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })),
);

/** Tope de la hoja "Umbral bajo stock": la bandeja es para reponer, no para
 * volcar el catálogo (mismo tope que el export de la tabla). */
const LOW_STOCK_SHEET_MAX = 1000;

export default function StockPage() {
  const { filters, applyVersion } = useReportsFilters();
  const dash = useInventoryDashboard(filters, applyVersion);
  const [isExporting, setIsExporting] = useState(false);

  // El badge cuenta el borrador, que es lo que el usuario ve en los selects.
  const extraActiveCount = [
    dash.extraDraft.warehouseId,
    dash.extraDraft.thresholdOverride,
    dash.extraDraft.valuationPriceListId,
  ].filter((v) => v !== null && v !== undefined).length;

  // El Excel no lleva el rango de fechas en el nombre porque el stock es una
  // foto del presente: el archivo vale para el día en que se descargó. Sale
  // con los filtros APLICADOS, igual que la pantalla.
  async function handleDownload() {
    setIsExporting(true);
    try {
      const [rows, lowStock] = await Promise.all([
        fetchInventoryReport(dash.warehouseId, dash.threshold ?? undefined, dash.valuationPriceListId),
        dash.threshold !== null
          ? inventoryService.getLowStockProducts(
              dash.warehouseId,
              dash.threshold,
              1,
              LOW_STOCK_SHEET_MAX,
            )
          : Promise.resolve(null),
      ]);
      if (rows.length === 0) {
        toast({ title: 'No hay stock para los filtros seleccionados', variant: 'warning' });
        return;
      }
      generateInventoryReportExcel(rows, lowStock?.data ?? [], dash.threshold, getTodayDate());
      toast({ title: `Reporte exportado: ${rows.length} filas de stock`, variant: 'success' });
      if (lowStock && lowStock.page.total > LOW_STOCK_SHEET_MAX) {
        toast({
          title: `La hoja de umbral trae los primeros ${LOW_STOCK_SHEET_MAX} de ${lowStock.page.total} SKUs`,
          variant: 'info',
        });
      }
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes de inventario</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>
        <ReportGuideSheet guide={inventoryGuide} />
      </div>
      <ReportsFilterBar
        extraFields={<InventoryOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        extraDirty={dash.isExtraDirty}
        onClearExtra={dash.clearExtra}
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
        footNote={
          <>
            Inventario es una{' '}
            <strong className="font-medium text-foreground">foto del stock de hoy</strong>; el
            rango de fechas solo afecta a Flujo de inventario, Tipos de movimiento y Rotación.
            No hay filtros de canal, pago ni geografía porque el stock no sale de un pedido; el
            equivalente de sede es el almacén. Con un almacén elegido,{' '}
            <strong className="font-medium text-foreground">Unidades en stock</strong> son las de
            ese almacén, pero{' '}
            <strong className="font-medium text-foreground">Stock bajo</strong> y la bandeja de
            reposición cuentan el SKU sumando todos los almacenes: se repone por SKU, no por
            depósito.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <InventoryDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
