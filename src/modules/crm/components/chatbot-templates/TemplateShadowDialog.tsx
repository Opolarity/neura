import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoaderContent from "@/shared/components/loader/LoaderContent";
import { formatDateTime } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import { chatbotTemplateShadowHitsApi } from "../../services/crm.service";
import type { ChatbotTemplate, ShadowHit } from "../../types/chatbotTemplates.types";

interface TemplateShadowDialogProps {
  template: ChatbotTemplate | null;
  activating: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (template: ChatbotTemplate) => Promise<boolean>;
}

/**
 * T-921 (punto 3): dónde se habría usado una plantilla en observación — los
 * mensajes reales de los últimos 30 días en que Jev la habría elegido — y el
 * botón para activarla.
 */
export default function TemplateShadowDialog({ template, activating, onOpenChange, onActivate }: TemplateShadowDialogProps) {
  const [hits, setHits] = useState<ShadowHit[] | null>(null);

  useEffect(() => {
    if (!template) return;
    setHits(null);
    chatbotTemplateShadowHitsApi(template.name)
      .then(setHits)
      .catch((error) => {
        toastError(error, undefined, "No se pudo cargar dónde se habría usado");
        setHits([]);
      });
  }, [template]);

  if (!template) return null;

  return (
    <Dialog open onOpenChange={(open) => !activating && onOpenChange(open)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{template.name}</DialogTitle>
          <DialogDescription>
            En observación: el bot no la manda. Estos son los mensajes de los últimos 30 días en que Jev la habría elegido.
          </DialogDescription>
        </DialogHeader>

        {hits == null ? (
          <div className="py-8">
            <LoaderContent message="Cargando mensajes..." />
          </div>
        ) : hits.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no hubo ningún mensaje en el que Jev la habría elegido.
          </p>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto">
            <ul className="flex flex-col gap-2">
              {hits.map((h) => (
                <li key={h.turnId} className="rounded-md bg-muted p-2 text-sm">
                  <p className="whitespace-pre-line">{h.mensaje ?? "(sin texto)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(h.at)}
                    {h.probabilidad != null ? ` · ${Math.round(h.probabilidad * 100)} %` : ""}
                    {h.accion === "jev_manda" ? " · la habría mandado sola" : " · el modelo la habría visto"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={activating} onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            disabled={activating}
            onClick={async () => {
              if (await onActivate(template)) onOpenChange(false);
            }}
          >
            {activating && <Loader2 className="w-4 h-4 animate-spin" />}
            Activar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
