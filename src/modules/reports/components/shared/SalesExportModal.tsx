import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/shared/utils/utils";

import { fetchSalesReport } from "../../services/reports.service";
import { generateSalesReportExcel } from "../../utils/generateSalesReportExcel";

interface SalesExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesExportModal({ open, onOpenChange }: SalesExportModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const daysDiff =
    startDate && endDate ? differenceInDays(endDate, startDate) : null;

  const isValid =
    startDate !== undefined &&
    endDate !== undefined &&
    daysDiff !== null &&
    daysDiff >= 0 &&
    daysDiff <= 31;

  const validationError =
    startDate && endDate && daysDiff !== null
      ? daysDiff < 0
        ? "La fecha fin debe ser posterior a la fecha inicio"
        : daysDiff > 31
        ? "El rango máximo permitido es de 31 días"
        : null
      : null;

  async function handleDownload() {
    if (!isValid || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      const rows = await fetchSalesReport(start, end);
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
        setStartDate(undefined);
        setEndDate(undefined);
      }
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Descargar Reporte de Ventas</DialogTitle>
          <DialogDescription>
            Selecciona un rango de fechas (máximo 31 días) para exportar las
            ventas a Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Fecha inicio */}
          <div className="grid gap-2">
            <Label>Fecha inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate
                    ? format(startDate, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha fin */}
          <div className="grid gap-2">
            <Label>Fecha fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate
                    ? format(endDate, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

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
