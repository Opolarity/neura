import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { previewTemplate, validateTemplateContent } from "../../adapters/chatbotTemplates.adapter";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";

interface ChatbotTemplateFormDialogProps {
  template: ChatbotTemplate | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: ChatbotTemplate, content: string) => Promise<boolean>;
}

export default function ChatbotTemplateFormDialog({
  template,
  saving,
  onOpenChange,
  onSave,
}: ChatbotTemplateFormDialogProps) {
  const [content, setContent] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(template?.content ?? "");
    setTouched(false);
  }, [template]);

  const error = useMemo(
    () => (template ? validateTemplateContent(template, content) : null),
    [template, content]
  );

  if (!template) return null;

  /** Inserta {dato} donde está el cursor. */
  const insertPlaceholder = (key: string) => {
    const el = textareaRef.current;
    const token = `{${key}}`;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    setContent(content.slice(0, start) + token + content.slice(end));
    setTouched(true);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    setTouched(true);
    if (error) return;
    if (await onSave(template, content)) onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !saving && onOpenChange(open)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{template.name}</DialogTitle>
          {template.description && <DialogDescription>{template.description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-content" required>
              Texto
            </Label>
            <Textarea
              id="tpl-content"
              ref={textareaRef}
              value={content}
              rows={14}
              aria-required
              aria-invalid={touched && !!error}
              className={touched && error ? "border-destructive focus-visible:ring-destructive" : undefined}
              onChange={(e) => {
                setContent(e.target.value);
                setTouched(true);
              }}
            />
            {touched && error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vista previa</Label>
            <div className="min-h-[200px] rounded-md border bg-muted p-3 text-sm whitespace-pre-wrap break-words">
              {previewTemplate(content)}
            </div>
            <p className="text-xs text-muted-foreground">
              Los datos entre corchetes los completa el bot con la información de cada cliente.
            </p>
          </div>
        </div>

        {template.placeholders.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Datos disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {template.placeholders.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertPlaceholder(key)}
                  title="Insertar en el texto"
                >
                  <Badge variant={template.requiredPlaceholders.includes(key) ? "info" : "secondary"} className="font-mono">
                    {`{${key}}`}
                  </Badge>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los datos en azul son obligatorios: no se pueden quitar del texto. Si un dato llega vacío, el bot no
              envía la línea donde está. Escribe <span className="font-mono">{"{dato?}"}</span> para enviar la línea
              igual, o <span className="font-mono">{"{dato|texto}"}</span> para usar un texto por defecto.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={saving || (touched && !!error)} onClick={handleSave}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
