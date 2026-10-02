import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Lock, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fromFriendlyText,
  previewFriendlyText,
  templateVariables,
  toFriendlyText,
  validateFriendlyText,
} from "../../adapters/chatbotTemplates.adapter";
import { TEMPLATE_TOPICS, templateSlug, topicLabel } from "../../adapters/chatbotTemplateTopics";
import { toggleInline, toggleLines, type Edit } from "../../adapters/whatsappFormat";
import type {
  ChatbotTemplate,
  ChatbotTemplateCreateInput,
  ChatbotTemplateMeta,
  ChatbotTemplateTopic,
} from "../../types/chatbotTemplates.types";
import FormatToolbar, { type FormatAction } from "./FormatToolbar";
import TagPicker from "./TagPicker";
import WhatsAppPreview from "./WhatsAppPreview";

interface ChatbotTemplateFormDialogProps {
  /** La plantilla que se edita; null si no hay ninguna abierta. */
  template: ChatbotTemplate | null;
  /** T-917: true = crear una plantilla nueva. */
  creating: boolean;
  saving: boolean;
  /** T-917: nombres de las etiquetas que ya existen. */
  tagOptions: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (template: ChatbotTemplate, content: string, meta?: ChatbotTemplateMeta) => Promise<boolean>;
  onCreate: (input: ChatbotTemplateCreateInput) => Promise<boolean>;
}

/** Mismas reglas que sp_crm_chatbot_template_create (T-917). */
const NAME_RE = /^[a-z][a-z0-9_]{2,59}$/;
const RESERVED_NAMES = new Set(["resumen_confirmacion", "cambio_confirmado", "ubicacion_sede", "datos_para_derivar"]);

const validateMeta = (creating: boolean, slug: string, topic: ChatbotTemplateTopic | ""): string | null => {
  if (creating) {
    if (!NAME_RE.test(slug)) return "El nombre tiene que empezar con una letra y tener entre 3 y 60 caracteres.";
    if (RESERVED_NAMES.has(slug)) return "Ese nombre ya lo usa el bot. Elige otro.";
  }
  if (!topic) return "Elige la etiqueta principal.";
  return null;
};

/**
 * Editor de una plantilla. Los datos que llena el bot se muestran como
 * [Nombre] y se convierten a la sintaxis del bot ({clave}) recién al guardar.
 * T-917: también crea plantillas nuevas (nombre, etiquetas y texto). Las
 * etiquetas se editan en todas menos en las especiales; las creadas desde el
 * ERP no llevan datos.
 */
export default function ChatbotTemplateFormDialog({
  template,
  creating,
  saving,
  tagOptions,
  onOpenChange,
  onSave,
  onCreate,
}: ChatbotTemplateFormDialogProps) {
  const [text, setText] = useState("");
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<ChatbotTemplateTopic | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const vars = useMemo(() => (template ? templateVariables(template) : []), [template]);
  /** Sin datos variables: las nuevas y las creadas desde el ERP. */
  const noVars = creating || !!template?.fromErp;
  /** Etiquetas editables: todas menos las especiales. */
  const tagsEditable = creating || !template?.locked;
  const slug = templateSlug(name);
  const topicName = topic ? topicLabel(topic) : null;

  useEffect(() => {
    setText(template ? toFriendlyText(template.content) : "");
    setFallbacks(Object.fromEntries(vars.filter((v) => v.fallback != null).map((v) => [v.key, v.fallback as string])));
    setName("");
    setTopic(template?.topic ?? "");
    setTags(template?.tags ?? []);
    setTouched(false);
  }, [template, vars, creating]);

  const textError = useMemo(
    () =>
      noVars && /\{[A-Za-z0-9_]+(\?|\|[^}]*)?\}/.test(text)
        ? "Las plantillas creadas desde el ERP no llevan datos variables entre llaves: escribe el texto completo."
        : validateFriendlyText(text, vars, fallbacks),
    [noVars, text, vars, fallbacks]
  );
  const metaError = tagsEditable ? validateMeta(creating, slug, topic) : null;
  const error = metaError ?? textError;

  if (!template && !creating) return null;

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
    const content = fromFriendlyText(text, vars, fallbacks);
    const meta: ChatbotTemplateMeta | undefined = tagsEditable && topic ? { topic, tags } : undefined;
    const ok = creating
      ? await onCreate({ name: name.trim(), content, ...(meta as ChatbotTemplateMeta) })
      : await onSave(template!, content, meta);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !saving && onOpenChange(open)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {creating ? (
            <>
              <DialogTitle>Nueva plantilla</DialogTitle>
              <DialogDescription>
                El bot la reconoce por su nombre, sus etiquetas y su texto. Va tal cual, sin datos del cliente.
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="font-mono text-base">{template!.name}</DialogTitle>
              {template!.description && !template!.fromErp && (
                <DialogDescription>{template!.description}</DialogDescription>
              )}
            </>
          )}
        </DialogHeader>

        {creating && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-name" required>
              Nombre
            </Label>
            <Input
              id="tpl-name"
              value={name}
              aria-required
              maxLength={80}
              placeholder="Cambio de talla"
              onChange={(e) => {
                setName(e.target.value);
                setTouched(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {slug ? (
                <>
                  Se guarda como <span className="font-mono text-foreground">{slug}</span>. No se puede cambiar después.
                </>
              ) : (
                "Puedes escribirlo con espacios: se guarda en minúsculas y con guion bajo. No se puede cambiar después."
              )}
            </p>
          </div>
        )}

        {tagsEditable ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-topic" required>
                Etiqueta principal
              </Label>
              <Select
                value={topic}
                onValueChange={(v) => {
                  setTopic(v as ChatbotTemplateTopic);
                  setTouched(true);
                }}
              >
                <SelectTrigger id="tpl-topic" aria-required>
                  <SelectValue placeholder="Elige la etiqueta principal" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TOPICS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {topic
                  ? TEMPLATE_TOPICS.find((t) => t.value === topic)?.hint
                  : "Una de las 11 con que el bot clasifica cada mensaje del cliente."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-tags">Otras etiquetas</Label>
              <TagPicker
                id="tpl-tags"
                value={tags}
                options={tagOptions}
                exclude={topicName}
                onChange={(v) => {
                  setTags(v);
                  setTouched(true);
                }}
              />
              <p className="text-xs text-muted-foreground">Opcionales. Elige las que ya existen o escribe una nueva.</p>
            </div>
            {touched && metaError && <p className="text-sm text-destructive md:col-span-2">{metaError}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={template!.topic ? "secondary" : "outline"}>{topicLabel(template!.topic)}</Badge>
              {template!.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Plantilla especial: la arma el bot en un flujo fijo, así que sus etiquetas no se cambian. El texto sí.
            </p>
          </div>
        )}

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
              aria-invalid={touched && !!textError}
              className={touched && textError ? "border-destructive focus-visible:ring-destructive" : undefined}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setText(e.target.value);
                setTouched(true);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Selecciona texto y usa la barra, o escribe como en WhatsApp: *negrita*, _cursiva_, ~tachado~.
            </p>
            {touched && textError && <p className="text-sm text-destructive">{textError}</p>}
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
