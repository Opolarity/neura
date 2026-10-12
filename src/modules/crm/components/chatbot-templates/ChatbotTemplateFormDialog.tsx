import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Lock } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fromFriendlyText,
  previewFriendlyText,
  rolLabel,
  templateVariables,
  toFriendlyText,
  validateFriendlyText,
  variablesInText,
} from "../../adapters/chatbotTemplates.adapter";
import { TEMPLATE_TOPICS, jevTagError, jevTagFor, templateSlug, topicLabel } from "../../adapters/chatbotTemplateTopics";
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
  /** T-917: nombres de las etiquetas externas (creadas desde el ERP) que ya existen. */
  tagOptions: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (template: ChatbotTemplate, content: string, meta?: ChatbotTemplateMeta, saleSola?: boolean) => Promise<boolean>;
  onCreate: (input: ChatbotTemplateCreateInput) => Promise<boolean>;
}

/** Mismas reglas que sp_crm_chatbot_template_create (T-917). */
const NAME_RE = /^[a-z][a-z0-9_]{2,59}$/;
const RESERVED_NAMES = new Set(["resumen_confirmacion", "cambio_confirmado", "ubicacion_sede", "datos_para_derivar"]);

/** Una etiqueta de Jev no va como extra: solo como principal (fn_chatbot_template_set_tags). */
const extraBloqueada = (name: string): string | null => {
  const jev = jevTagFor(name);
  return jev ? jevTagError(jev) : null;
};

const validateMeta = (creating: boolean, slug: string, topic: ChatbotTemplateTopic | "", tags: string[]): string | null => {
  if (creating) {
    if (!NAME_RE.test(slug)) return "El nombre tiene que empezar con una letra y tener entre 3 y 60 caracteres.";
    if (RESERVED_NAMES.has(slug)) return "Ese nombre ya lo usa el bot. Elige otro.";
  }
  if (!topic) return "Elige la etiqueta principal.";
  for (const t of tags) {
    const motivo = extraBloqueada(t);
    if (motivo) return motivo;
  }
  return null;
};

/**
 * Editor de una plantilla. Los datos que llena el bot se muestran como
 * [Nombre] y se convierten a la sintaxis del bot ({clave}) recién al guardar.
 * T-917: también crea plantillas nuevas (nombre, etiquetas y texto). Las
 * etiquetas se editan en todas menos en las especiales. Desde el 05/10/2026
 * cualquier [dato] se puede agregar o quitar, también en las creadas desde el
 * ERP: el bot llena los que puede y no muestra los que no.
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
  const [saleSola, setSaleSola] = useState(true);
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Cuándo se abrió el editor: el interruptor ignora los clics de ese primer momento. */
  const abiertoEn = useRef(0);

  const vars = useMemo(() => (template ? templateVariables(template) : []), [template]);
  /** Etiquetas editables: todas menos las especiales. */
  const tagsEditable = creating || !template?.locked;
  const slug = templateSlug(name);

  useEffect(() => {
    setText(template ? toFriendlyText(template.content) : "");
    setFallbacks(Object.fromEntries(vars.filter((v) => v.fallback != null).map((v) => [v.key, v.fallback as string])));
    setName("");
    setTopic(template?.topic ?? "");
    setTags(template?.tags ?? []);
    setSaleSola(template?.saleSola ?? true);
    setTouched(false);
    abiertoEn.current = Date.now();
  }, [template, vars, creating]);

  const textError = useMemo(() => validateFriendlyText(text, vars, fallbacks), [text, vars, fallbacks]);
  const metaError = tagsEditable ? validateMeta(creating, slug, topic, tags) : null;
  const error = metaError ?? textError;

  if (!template && !creating) return null;

  /** El texto para cuando falta el dato, solo de los que siguen en el texto. */
  const withFallback = variablesInText(text, vars).filter((v) => v.fallback != null);
  const hasData = /\[[^[\]\n]+\]/.test(text);
  /** T-922: el interruptor quedó distinto de lo guardado (se avisa antes de guardar). */
  const cambiaSola = !creating && !template!.locked && saleSola !== template!.saleSola;

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
      : await onSave(template!, content, meta, template!.locked ? undefined : saleSola);
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
            // T-922: sin la descripción. En las del sistema eran notas internas para el bot
            // ("T-771: la manda el SERVICIO…") y desde el ERP no se pueden llenar.
            <DialogTitle className="font-mono text-base">{template!.name}</DialogTitle>
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
                blocked={extraBloqueada}
                onChange={(v) => {
                  setTags(v);
                  setTouched(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Opcionales. Elige las creadas desde el ERP o escribe una nueva. Las etiquetas principales no van acá.
              </p>
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
              Plantilla bloqueada{template!.rol ? ` (${rolLabel(template!.rol)})` : ""}: es parte de un flujo fijo del
              bot (pedido, pago o comprobantes), así que sus etiquetas no se cambian y no se puede eliminar. El texto sí.
            </p>
          </div>
        )}

        {!creating && !template!.locked && (
          <div className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="tpl-sale-sola">Jev puede mandarla sola</Label>
              <p className="text-xs text-muted-foreground">
                Si está activo y Jev está seguro de que responde el mensaje, la manda sin pasar por el modelo. Apágalo si
                la respuesta depende de la cuenta, del pedido o de algo que el cliente dijo antes.
              </p>
              {cambiaSola && (
                <p className="text-xs font-medium text-warning" role="status">
                  {saleSola ? "Al guardar, Jev podrá mandarla sola." : "Al guardar, Jev ya no la manda sola."}
                </p>
              )}
            </div>
            <Switch
              id="tpl-sale-sola"
              checked={saleSola}
              onCheckedChange={(v) => {
                // Un doble clic en "Editar" cae justo donde aparece el interruptor (07/10/2026):
                // el segundo clic lo cambiaba sin que se notara.
                if (Date.now() - abiertoEn.current < 500) return;
                setSaleSola(v);
                setTouched(true);
              }}
            />
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
            <p className="text-xs text-muted-foreground">
              Para que el bot ponga un dato del cliente o del pedido, escríbelo entre corchetes, por ejemplo [Ciudad]
              o [Número de pedido]. Si el bot no lo tiene, no lo muestra.
            </p>
            {touched && textError && <p className="text-sm text-destructive">{textError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vista previa</Label>
            <WhatsAppPreview text={previewFriendlyText(text, vars)} />
            {hasData && (
              <p className="text-xs text-muted-foreground">
                Los datos conocidos se muestran con un ejemplo; los demás, tal como los escribiste.
              </p>
            )}
          </div>
        </div>

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
