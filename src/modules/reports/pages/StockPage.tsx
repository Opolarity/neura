import { Suspense, lazy, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/shared/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { InventoryOptionsPanel } from '../components/inventory/InventoryOptionsPanel';
import { useInventoryDashboard } from '../hooks/useInventoryDashboard';
import { fetchInventoryReport } from '../services/reports.service';
import { generateInventoryReportExcel } from '../utils/generateInventoryReportExcel';
import { getTodayDate } from '@/shared/utils/date';
import { toastError } from '@/shared/utils/toastError';

const InventoryDashboard = lazy(() =>
  import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })),
);

export default function StockPage() {
  const { filters } = useReportsFilters();
  const dash = useInventoryDashboard(filters);
  const [isExporting, setIsExporting] = useState(false);

  const extraActiveCount = [
    dash.warehouseId,
    dash.thresholdOverride,
    dash.valuationPriceListId,
  ].filter((v) => v !== null && v !== undefined).length;

  function handleClearExtra() {
    dash.setWarehouseId(undefined);
    dash.setThresholdOverride(undefined);
    dash.setValuationPriceListId(undefined);
  }

  // El Excel no lleva el rango de fechas en el nombre porque el stock es una
  // foto del presente: el archivo vale para el día en que se descargó.
  async function handleDownload() {
    setIsExporting(true);
    try {
      const rows = await fetchInventoryReport(
        dash.warehouseId,
        dash.threshold ?? undefined,
        dash.valuationPriceListId,
      );
      if (rows.length === 0) {
        toast({ title: 'No hay stock para los filtros seleccionados', variant: 'warning' });
        return;
      }
      generateInventoryReportExcel(rows, getTodayDate());
      toast({ title: `Reporte exportado: ${rows.length} filas de stock`, variant: 'success' });
    } catch (error) {
      toastError(error, 'Error al generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de inventario</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        extraFields={<InventoryOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
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
            Casi todo Inventario es una{' '}
            <strong className="font-medium text-foreground">foto del stock de hoy</strong> y no
            depende del rango de fechas: las tarjetas, la valorización, el stock por categoría y
            por talla, la bandeja de reposición y el stock muerto. El rango solo afecta a{' '}
            <strong className="font-medium text-foreground">Flujo de inventario</strong>,{' '}
            <strong className="font-medium text-foreground">Tipos de movimiento</strong> y{' '}
            <strong className="font-medium text-foreground">Rotación</strong>, que miden
            movimientos del período. Los filtros de canal, método de pago y geografía no existen
            acá porque el stock no sale de un pedido; el equivalente de sede es el almacén.{' '}
            Ojo con ese filtro: al elegir un almacén,{' '}
            <strong className="font-medium text-foreground">Unidades en stock</strong> son las de
            ese almacén, pero{' '}
            <strong className="font-medium text-foreground">Stock bajo</strong> cuenta los SKUs
            cuyo stock <em>sumando todos los almacenes</em> queda bajo el umbral. Se repone por
            SKU, no por depósito: no se compra porque un almacén esté corto si otro tiene de
            sobra. La bandeja de reposición y la distribución usan ese mismo criterio, así que
            las tres cifras siempre coinciden entre sí.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <InventoryDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
