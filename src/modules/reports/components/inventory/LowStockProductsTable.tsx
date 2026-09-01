import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/shared/hooks/use-toast';
import { ChartLoading, EmptyReportState, ReportCard } from '../shared/ReportScaffold';
import { formatNumber } from '../shared/reportChartUtils';
import { inventoryService } from '../../services/reports.service';
import { generateLowStockReportExcel } from '../../utils/generateLowStockReportExcel';
import type { InventoryDashboardState } from '../../hooks/useInventoryDashboard';

/** Tope de filas del export: la bandeja es para reponer, no para volcar el catálogo. */
const EXPORT_MAX = 1000;

/**
 * T-269 · Bandeja de reposición.
 *
 * Lee `sp_rpt_low_stock_products`, que aplica exactamente la misma definición
 * que la alerta de la campana y que el indicador de los listados
 * (`vw_sku_effective_stock`). Sin filtro de almacén, su total coincide con el
 * KPI "Stock bajo" de esta misma pantalla.
 */
export function LowStockProductsTable({ dash }: { dash: InventoryDashboardState }) {
  const [exporting, setExporting] = useState(false);
  const report = dash.lowStockProducts.data;
  const total = report?.page.total ?? 0;
  const rows = report?.data ?? [];
  const totalPages = Math.ceil(total / dash.lowStockPageSize);

  const warehouseName =
    dash.warehouses.data?.find((w) => w.id === dash.warehouseId)?.name ?? null;

  async function handleExport() {
    if (dash.threshold === null) return;
    setExporting(true);
    try {
      // Se pide la lista completa (hasta EXPORT_MAX) para no exportar solo la
      // página visible.
      const full = await inventoryService.getLowStockProducts(
        dash.warehouseId,
        dash.threshold ?? undefined,
        1,
        EXPORT_MAX,
        dash.lowStockSearch || undefined,
      );
      if (!full.data.length) {
        toast({ title: 'No hay productos bajo el umbral para exportar', variant: 'info' });
        return;
      }
      generateLowStockReportExcel(full.data, dash.threshold, warehouseName);
      if (full.page.total > EXPORT_MAX) {
        toast({
          title: `Se exportaron los primeros ${EXPORT_MAX} de ${full.page.total} SKUs`,
          variant: 'info',
        });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'No se pudo generar el export', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <ReportCard
      title="Productos bajo el umbral (reposición)"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="warning">{formatNumber(total)} SKUs</Badge>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={dash.lowStockSearch}
              onChange={(e) => dash.setLowStockSearch(e.target.value)}
              placeholder="Producto o SKU"
              className="h-9 w-[220px] pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || dash.threshold === null || total === 0}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar
          </Button>
        </div>
      }
    >
      {dash.threshold === null ? (
        <EmptyReportState>
          Umbral de stock bajo no configurado. Definilo en Configuración → Negocio → Operación.
        </EmptyReportState>
      ) : dash.lowStockProducts.isLoading ? (
        <ChartLoading className="h-40" />
      ) : rows.length === 0 ? (
        <EmptyReportState>Ningún producto está por debajo del umbral.</EmptyReportState>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.product_variation_id}>
                  <TableCell className="text-sm font-medium">{item.product_title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sku ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="warning">{formatNumber(item.stock)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Pág {dash.lowStockPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={dash.lowStockPage === 1}
                  onClick={() => dash.setLowStockPage(dash.lowStockPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={dash.lowStockPage === totalPages}
                  onClick={() => dash.setLowStockPage(dash.lowStockPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </ReportCard>
  );
}
