import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Send, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import GuiaRemisionModal, { type GuiaRemisionData } from "@/modules/sales/components/GuiaRemisionModal";
import {
  createRequestGuide,
  emitRequestGuide,
  getRequestGuides,
  type RequestGuide,
  type RequestGuideItem,
} from "../../services/RemisionGuide.service";

interface Props {
  requestId: number;
  /** Solo quien envía, con la solicitud en «Enviado», puede generar la guía. */
  canGenerate: boolean;
  fromWarehouseId: number | null;
  toWarehouseId: number | null;
  items: RequestGuideItem[];
}

/**
 * T-4: guías de remisión electrónicas (GRE) de una solicitud de inventario.
 * Se generan con el mismo modal y las mismas edge functions que la GRE de
 * ventas; el destinatario es la propia empresa (traslado entre almacenes).
 */
export default function RequestRemisionGuides({
  requestId,
  canGenerate,
  fromWarehouseId,
  toWarehouseId,
  items,
}: Props) {
  const { toast } = useToast();
  const [guides, setGuides] = useState<RequestGuide[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [emittingId, setEmittingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setGuides(await getRequestGuides(requestId));
    } catch (err) {
      toastError(err, "No se pudieron cargar las guías de remisión");
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (gre: GuiaRemisionData) => {
    try {
      await createRequestGuide(requestId, items, gre);
      toast({ title: "Guía creada", description: "Emítela a SUNAT desde la lista.", variant: "success" });
      setModalOpen(false);
      await load();
    } catch (err) {
      toastError(err, "No se pudo crear la guía de remisión");
    }
  };

  const handleEmit = async (guide: RequestGuide) => {
    setEmittingId(guide.id);
    try {
      await emitRequestGuide(guide.id);
      toast({ title: "Guía emitida", description: "Se envió a SUNAT correctamente.", variant: "success" });
      await load();
    } catch (err) {
      toastError(err, "Error al emitir la guía", "Error de emisión");
    } finally {
      setEmittingId(null);
    }
  };

  if (!canGenerate && guides.length === 0) return null;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Guía de remisión</h2>
        {canGenerate && (
          <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)} disabled={items.length === 0}>
            <Truck className="h-4 w-4" />
            Generar guía
          </Button>
        )}
      </div>

      {guides.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay guías para esta solicitud.</p>
      ) : (
        <ul className="space-y-2">
          {guides.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="font-medium">
                {g.invoiceNumber ?? `${g.taxSerie ?? "GRE"} (sin número)`}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={g.declared ? "default" : "secondary"}>
                  {g.declared ? "Emitida" : "Pendiente de emitir"}
                </Badge>
                {g.declared && g.pdfUrl && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={g.pdfUrl} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4" />
                      PDF
                    </a>
                  </Button>
                )}
                {!g.declared && canGenerate && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleEmit(g)} disabled={emittingId !== null}>
                    {emittingId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Emitir a SUNAT
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <GuiaRemisionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transfer={{ fromWarehouseId, toWarehouseId }}
        onConfirm={handleCreate}
      />
    </div>
  );
}
