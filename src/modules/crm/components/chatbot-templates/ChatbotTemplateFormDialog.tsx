import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fromFriendlyText,
  previewFriendlyText,
  templateVariables,
  toFriendlyText,
  validateFriendlyText,
} from "../../adapters/chatbotTemplates.adapter";
import { toggleInline, toggleLines, type Edit } from "../../adapters/whatsappFormat";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";
import FormatToolbar, { type FormatAction } from "./FormatToolbar";
import WhatsAppPreview from "./WhatsAppPreview";

interface ChatbotTemplateFormDialogProps {
  template: ChatbotTemplate | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: ChatbotTemplate, content: string) => Promise<boolean>;
}

/**
 * Editor de una plantilla. Los datos que llena el bot se muestran como
 * [Nombre] y se convierten a la sintaxis del bot ({clave}) recién al guardar.
 */
export default function ChatbotTemplateFormDialog({
  template,
  saving,
  onOpenChange,
  onSave,
}: ChatbotTemplateFormDialogProps) {
  const [text, setText] = useState("");
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const vars = useMemo(() => (template ? templateVariables(template) : []), [template]);

  useEffect(() => {
    setText(template ? toFriendlyText(template.content) : "");
    setFallbacks(Object.fromEntries(vars.filter((v) => v.fallback != null).map((v) => [v.key, v.fallback as string])));
    setTouched(false);
  }, [template, vars]);

  const error = useMemo(() => validateFriendlyText(text, vars, fallbacks), [text, vars, fallbacks]);

  if (!template) return null;

  const withFallback = vars.filter((v) => v.fallback != null);

  /** Inserta [Nombre] donde está el cursor. */
  const insertVariable = (label: string) => {
    const el = textareaRef.current;
    const token = `[${label}]`;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + token + text.slice(end));
    setTouched(true);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  /** Aplica un formato de WhatsApp a la selección y la deja seleccionada. */
  const applyFormat = (action: FormatAction) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const edit: Edit =
      action.type === "inline" ? toggleInline(text, start, end, action.mark) : toggleLines(text, start, end, action.mark);
    setText(edit.text);
    setTouched(true);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    const action: FormatAction | null =
      key === "b" && !e.shiftKey
        ? { type: "inline", mark: "*" }
        : key === "i" && !e.shiftKey
          ? { type: "inline", mark: "_" }
          : key === "x" && e.shiftKey
            ? { type: "inline", mark: "~" }
            : null;
    if (!action) return;
    e.preventDefault();
    applyFormat(action);
  };

  const handleSave = async () => {
    setTouched(true);
    if (error) return;
    if (await onSave(template, fromFriendlyText(text, vars, fallbacks))) onOpenChange(false);
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
            <FormatToolbar onApply={applyFormat} />
            <Textarea
              id="tpl-content"
              ref={textareaRef}
              value={text}
              rows={14}
              aria-required
              aria-invalid={touched && !!error}
              className={touched && error ? "border-destructive focus-visible:ring-destructive" : undefined}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setText(e.target.value);
                setTouched(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Selecciona texto y usa la barra, o escribe como en WhatsApp: *negrita*, _cursiva_, ~tachado~.
            </p>
            {touched && error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vista previa</Label>
            <WhatsAppPreview text={previewFriendlyText(text, vars)} />
            {vars.length > 0 && (
              <p className="text-xs text-muted-foreground">Los datos se muestran con un ejemplo.</p>
            )}
          </div>
        </div>

        {vars.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Insertar dato</Label>
            <p className="text-xs text-muted-foreground">
              El bot reemplaza cada dato entre corchetes por la información del cliente. Los obligatorios no se
              pueden quitar del texto.
            </p>
            <div className="flex flex-wrap gap-2">
              {vars.map((v) => (
                <Button
                  key={v.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Insertar en el texto"
                  onClick={() => insertVariable(v.label)}
                >
                  <Plus className="w-4 h-4" />
                  {v.label}
                  {v.required && <span className="text-xs font-normal text-muted-foreground">· obligatorio</span>}
                </Button>
              ))}
            </div>
          </div>
        )}

        {withFallback.map((v) => (
          <div key={v.key} className="flex flex-col gap-2">
            <Label htmlFor={`tpl-fallback-${v.key}`} required>
              Si el bot no tiene [{v.label}], escribir
            </Label>
            <Input
              id={`tpl-fallback-${v.key}`}
              value={fallbacks[v.key] ?? ""}
              aria-required
              onChange={(e) => {
                setFallbacks({ ...fallbacks, [v.key]: e.target.value });
                setTouched(true);
              }}
            />
          </div>
        ))}

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
