import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, DateRangeValue } from "@/shared/components/date-range";
import { diffCalendarDays } from "@/shared/utils/date";

import { fetchSalesReport } from "../../services/reports.service";
import type { SalesExtraFilters } from "../../services/reports.service";
import { generateSalesReportExcel } from "../../utils/generateSalesReportExcel";
import type { ReportsFilters } from "../../types/reports.types";

// Tope del rango exportable, en días de calendario.
const MAX_DAYS = 31;

interface SalesExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: ReportsFilters;
  extra?: SalesExtraFilters;
}

export function SalesExportModal({ open, onOpenChange, filters, extra }: SalesExportModalProps) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = ({ startDate, endDate }: DateRangeValue) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  const daysDiff =
    startDate && endDate ? diffCalendarDays(startDate, endDate) : null;

  const isValid =
    startDate !== null &&
    endDate !== null &&
    daysDiff !== null &&
    daysDiff >= 0 &&
    daysDiff <= MAX_DAYS;

  const validationError =
    startDate && endDate && daysDiff !== null
      ? daysDiff < 0
        ? "La fecha fin debe ser posterior a la fecha inicio"
        : daysDiff > MAX_DAYS
        ? `El rango máximo permitido es de ${MAX_DAYS} días`
        : null
      : null;

  async function handleDownload() {
    if (!isValid || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const start = startDate;
      const end = endDate;
      const rows = await fetchSalesReport(start, end, filters, extra);
      generateSalesReportExcel(rows, start, end);
      toast.success(`${rows.length} ventas exportadas correctamente`);
      onOpenChange(false);
    } catch {
      toast.error("Error al generar el reporte. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isLoading) {
      if (!value) {
        setStartDate(null);
        setEndDate(null);
      }
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Descargar Reporte de Ventas</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas (máximo {MAX_DAYS} días) para exportar las
            ventas a Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            startLabel="Fecha inicio"
            endLabel="Fecha fin"
            maxRangeDays={MAX_DAYS}
            disabled={isLoading}
          />

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {/* Range summary */}
          {isValid && daysDiff !== null && (
            <p className="text-sm text-muted-foreground">
              Rango seleccionado:{" "}
              <span className="font-medium text-foreground">
                {daysDiff + 1} día{daysDiff + 1 !== 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleDownload} disabled={!isValid || isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Generando..." : "Descargar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
