import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/shared/hooks/use-toast";
import { formatDateTime } from "@/shared/utils/date";
import { fetchServiceSituationHistory } from "@/modules/quotations/services/Quotations.service";
import { ServiceSituationHistoryItem } from "@/modules/quotations/types/Quotations.types";

/** Lo mínimo para pedir y rotular un historial. */
export interface ServiceHistoryTarget {
  id: number;
  description: string;
  code: string | null;
  /**
   * Quién hace el trabajo. Opcional: desde la cotización el proveedor es
   * el de la cabecera y no hace falta repetirlo; desde el Plan Maestro es
   * justo la pregunta que se viene a responder.
   */
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierDocumentType?: string | null;
  supplierDocumentNumber?: string | null;
}

interface ServiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceHistoryTarget | null;
}

/**
 * Los movimientos de un servicio, cada uno con su situación, sus cantidades y
 * quién lo registró.
 *
 * Vivía dentro del diálogo de avance, debajo del formulario. Son dos cosas
 * distintas -- una se consulta y la otra se escribe -- y juntas obligaban a
 * bajar por un formulario para leer el historial, y a cargarlo siempre aunque
 * solo se fuera a registrar un avance.
 */
export const ServiceHistoryDialog = ({
  open,
  onOpenChange,
  service,
}: ServiceHistoryDialogProps) => {
  const [history, setHistory] = useState<ServiceSituationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !service) return;

    const load = async () => {
      try {
        setLoading(true);
        setHistory(await fetchServiceSituationHistory(service.id));
      } catch (error: any) {
        toast({
          title: "Error al cargar el historial: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, service]);

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial del servicio
          </DialogTitle>
          <DialogDescription>
            {service.description}
            {service.code ? ` · ${service.code}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Quién lo está haciendo, antes de los movimientos: desde el Plan
            Maestro se abre para eso. Se imprime lo que hay; un proveedor sin
            teléfono no deja un rótulo vacío. */}
        {service.supplierName && (
          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="text-muted-foreground text-xs">Lo hace</div>
            <div className="font-medium">{service.supplierName}</div>
            <div className="text-muted-foreground text-xs">
              {[
                service.supplierDocumentType && service.supplierDocumentNumber
                  ? `${service.supplierDocumentType} ${service.supplierDocumentNumber}`
                  : null,
                service.supplierPhone || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}

        <div className="max-h-[60vh]">
          <ScrollArea className="h-full">
            <div className="py-2 pl-1 pr-4">
              {loading ? (
                <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando historial...
                </div>
              ) : history.length === 0 ? (
                <p className="text-muted-foreground py-4 text-sm">
                  Todavía no hay movimientos registrados.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {history.map((item, index) => (
                    <li
                      key={`${item.created_at}-${index}`}
                      className="px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {item.situation_name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDateTime(item.created_at)} ·{" "}
                          {item.created_by_name}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {item.quantity === null ? "—" : item.quantity}{" "}
                        {item.measurement_unit}
                        {item.bad_quantity
                          ? ` · merma ${item.bad_quantity}`
                          : ""}
                        {item.message ? ` · ${item.message}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
