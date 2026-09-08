import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTicketProtocol } from "../../hooks/useTicketProtocol";
import { SupportRichText } from "./SupportRichText";

/**
 * "Respuestas de tickets": cómo se revisa, se prioriza y se cierra lo que el
 * cliente envía.
 *
 * El texto ya no vive acá. Lo edita OPOLARITY en un solo lugar y lo leen este
 * ERP y los demás sistemas NEURA, así que corregir un plazo dejó de significar
 * un despliegue por cliente. Si no se puede consultar, se muestra la última
 * copia conocida (ver useTicketProtocol): un documento de consulta nunca debe
 * abrirse vacío.
 */
interface TicketResponseProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketResponseProtocolDialog = ({
  open,
  onOpenChange,
}: TicketResponseProtocolDialogProps) => {
  const { protocol, isStale, refetch } = useTicketProtocol(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{protocol.title}</DialogTitle>
          {protocol.subtitle && (
            <DialogDescription>{protocol.subtitle}</DialogDescription>
          )}
        </DialogHeader>

        {isStale && (
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Mostrando la última versión guardada.
            </p>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={refetch}>
              <RefreshCw className="h-3.5 w-3.5" /> Reintentar
            </Button>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto pr-2 pt-2">
          <SupportRichText html={protocol.html} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
