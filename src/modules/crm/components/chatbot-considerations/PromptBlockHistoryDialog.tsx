import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import { getPromptBlockHistoryApi } from "../../services/crm.service";
import type { PromptBlock, PromptBlockHistoryItem } from "../../types/chatbotConsiderations.types";

interface PromptBlockHistoryDialogProps {
  block: PromptBlock | null;
  saving: boolean;
  onClose: () => void;
  onUse: (block: PromptBlock, content: string) => Promise<boolean>;
}

/** Los textos que tuvo un párrafo, del más nuevo al más viejo. «Usar este texto» lo vuelve a guardar. */
export default function PromptBlockHistoryDialog({ block, saving, onClose, onUse }: PromptBlockHistoryDialogProps) {
  const [items, setItems] = useState<PromptBlockHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!block) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    getPromptBlockHistoryApi(block.id)
      .then((res) => !cancelled && setItems((res.data ?? []).filter((i) => i.content != null)))
      .catch((error) => toastError(error, undefined, "No se pudo cargar el historial"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [block]);

  return (
    <Dialog open={!!block} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial</DialogTitle>
          <DialogDescription>Los textos que tuvo este párrafo. «Usar este texto» lo guarda de nuevo y el bot lo usa en menos de un minuto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto pr-1">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          )}
          {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay cambios guardados.</p>}
          {block &&
            items.map((item, i) => (
              <div key={`${item.at}-${i}`} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDateTime(item.at)}
                    {item.by_name ? ` · ${item.by_name}` : item.source === "service" ? " · publicación del equipo" : ""}
                    {i === 0 ? " · vigente" : ""}
                  </span>
                  {i > 0 && (
                    <Button size="sm" variant="outline" disabled={saving} onClick={async () => (await onUse(block, item.content!)) && onClose()}>
                      Usar este texto
                    </Button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{item.content}</p>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
