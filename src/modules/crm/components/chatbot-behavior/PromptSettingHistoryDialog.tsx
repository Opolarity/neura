import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import { getChatbotPromptSettingHistoryApi } from "../../services/crm.service";
import { describeValue } from "../../adapters/chatbotBehavior.adapter";
import type { ChatbotPromptSetting, ChatbotPromptSettingHistoryItem } from "../../types/chatbotBehavior.types";

interface PromptSettingHistoryDialogProps {
  setting: ChatbotPromptSetting | null;
  onClose: () => void;
  /** Volver atrás = cargar ese valor en el formulario; después se guarda o publica como cualquier cambio. */
  onUse: (code: string, value: string) => void;
}

export default function PromptSettingHistoryDialog({ setting, onClose, onUse }: PromptSettingHistoryDialogProps) {
  const [items, setItems] = useState<ChatbotPromptSettingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!setting) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    getChatbotPromptSettingHistoryApi(setting.code)
      .then((res) => {
        if (!cancelled) setItems(res.data ?? []);
      })
      .catch((error) => toastError(error, undefined, "No se pudo cargar el historial"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setting]);

  // El valor con el que se instaló el ajuste no queda en audit_log (las filas se
  // cargan antes del disparador): es el "antes" de la publicación más vieja.
  const oldest = items[items.length - 1];
  const entries: Array<ChatbotPromptSettingHistoryItem & { initial?: boolean }> =
    oldest && oldest.previous_value !== null
      ? [...items, { value: oldest.previous_value, previous_value: null, published_at: "", published_by_name: null, initial: true }]
      : items;

  return (
    <Dialog open={!!setting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial: {setting?.name}</DialogTitle>
          <DialogDescription>
            Lo que se publicó, del más nuevo al más viejo. «Usar esta versión» la carga en el formulario: después hay que publicarla.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay publicaciones de este ajuste.</p>
          )}
          {setting &&
            entries.map((item, i) => (
              <div key={`${item.published_at}-${i}`} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {item.initial ? "Valor inicial" : formatDateTime(item.published_at)}
                    {item.published_by_name ? ` · ${item.published_by_name}` : ""}
                    {i === 0 ? " · vigente" : ""}
                  </span>
                  {i > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onUse(setting.code, item.value);
                        onClose();
                      }}
                    >
                      Usar esta versión
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{describeValue(setting, item.value)}</p>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
