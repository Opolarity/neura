import { useState } from "react";
import { History, Lock, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/utils";
import { isEditedByStore, isIntroLine, renderWithSettings, settingCodesIn, splitChoices } from "../../adapters/chatbotConsiderations.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import type { PromptBlock } from "../../types/chatbotConsiderations.types";
import Highlight from "./Highlight";
import SettingChoice from "./SettingChoice";
import SettingInline from "./SettingInline";

interface PromptBlockItemProps {
  block: PromptBlock;
  settings: ChatbotPromptSetting[];
  query: string;
  saving: boolean;
  onSave: (content: string, meta?: { title?: string; tags?: string[] }) => Promise<boolean>;
  onToggle: (active: boolean) => void;
  onRestore: () => void;
  onDelete: () => void;
  onHistory: () => void;
  /** En cuántos párrafos aparece cada ajuste. */
  settingUsage: Map<string, number>;
  onSaveSetting: (setting: ChatbotPromptSetting, value: string) => Promise<boolean>;
  onSettingHistory: (setting: ChatbotPromptSetting) => void;
}

const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

/**
 * Un párrafo del prompt como bloc de notas: se lee como texto y, si no es
 * técnico, un clic lo abre para editarlo. Los técnicos llevan candado; si
 * traen versiones según un ajuste (trato, emojis…), se ven todas ahí y la tienda
 * marca la que usa el bot; si nombran un dato (sedes, números…), se cambia debajo.
 */
export default function PromptBlockItem({ block, settings, query, saving, onSave, onToggle, onRestore, onDelete, onHistory, settingUsage, onSaveSetting, onSettingHistory }: PromptBlockItemProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content);
  const [title, setTitle] = useState(block.title);
  const [tags, setTags] = useState(block.tags.join(", "));
  const store = block.origin === "store";
  const edited = isEditedByStore(block);
  const setting = (code: string) => settings.find((s) => s.code === (code === "sales_whatsapp_display" ? "sales_whatsapp" : code));
  // Las versiones solo se eligen si el ajuste existe; si no, va el texto como lo lee el bot.
  const parts = block.locked ? splitChoices(block.content).map((p) => (p.kind === "choice" && !setting(p.code) ? { kind: "text" as const, text: p.raw } : p)) : [];
  const chosenCodes = new Set(parts.flatMap((p) => (p.kind === "choice" ? [p.code] : [])));
  const dataSettings = block.locked
    ? settingCodesIn(block.content)
        .filter((c) => !chosenCodes.has(c))
        .map(setting)
        .filter((s): s is ChatbotPromptSetting => !!s)
    : [];

  const open = () => {
    if (block.locked || editing) return;
    setText(block.content);
    setTitle(block.title);
    setTags(block.tags.join(", "));
    setEditing(true);
  };
  const save = async () => {
    const ok = await onSave(text, store ? { title, tags: splitTags(tags) } : undefined);
    if (ok) setEditing(false);
  };

  if (isIntroLine(block)) {
    return (
      <p className="whitespace-pre-wrap break-words px-1 pt-1 text-sm font-medium leading-relaxed text-foreground">
        <Highlight text={renderWithSettings(block.content, settings)} query={query} />
      </p>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-md border px-3 py-2 transition-colors",
        block.locked ? "border-transparent bg-muted/40" : "border-border hover:border-primary/40",
        store && "border-info/40 bg-info/5",
        !block.active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {block.locked && <Lock className="h-3.5 w-3.5 shrink-0" aria-label="Lo usa el sistema" />}
          {store && <Badge variant="info">Agregado por la tienda</Badge>}
          {edited && <Badge variant="warning">Editado por la tienda</Badge>}
          {!block.active && <Badge variant="secondary">Apagado</Badge>}
          {block.tags.map((t) => (
            <Badge key={t} variant="outline" className="font-normal">
              {t}
            </Badge>
          ))}
          {store && <span className="font-medium text-foreground">{block.title}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-70 group-hover:opacity-100">
          {edited && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onRestore} disabled={saving} title="Volver al texto del equipo">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {!block.locked && (
            <>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onHistory} title="Historial">
                <History className="h-4 w-4" />
              </Button>
              <Switch checked={block.active} disabled={saving} onCheckedChange={onToggle} aria-label={block.active ? "Apagar" : "Prender"} />
            </>
          )}
          {store && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={onDelete} disabled={saving} title="Borrar">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          {store && <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Título" />}
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={Math.min(16, Math.max(3, text.split("\n").length + 1))}
            maxLength={4000}
            className="font-mono text-sm"
          />
          {store && <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Etiquetas, separadas por coma" />}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {text.length} / 4000 · sin precios, sin links de otras páginas, sin líneas que empiecen con #
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button size="sm" onClick={save} disabled={saving || (text === block.content && (!store || (title === block.title && tags === block.tags.join(", "))))}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : block.locked ? (
        <div className="mt-1">
          {parts.map((p, i) => {
            if (p.kind === "choice") {
              const s = setting(p.code)!;
              // Una opción sin versión escrita también se elige: el bot no agrega nada.
              const missing = s.multiple ? [] : s.allowedValues.filter((v) => !p.variants.some((x) => x.value === v));
              return (
                <SettingChoice
                  key={i}
                  setting={s}
                  variants={[...p.variants, ...missing.map((value) => ({ value, text: "" }))]}
                  settings={settings}
                  query={query}
                  saving={saving}
                  usage={settingUsage.get(s.code) ?? 1}
                  onSave={(value) => onSaveSetting(s, value)}
                  onHistory={() => onSettingHistory(s)}
                />
              );
            }
            const text = renderWithSettings(p.text, settings);
            return text.trim() ? (
              <p key={i} className="whitespace-pre-wrap break-words text-sm leading-relaxed" title="Esta parte la usa el sistema. Para cambiarla, pídela al equipo.">
                <Highlight text={text} query={query} />
              </p>
            ) : null;
          })}
          {dataSettings.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {dataSettings.map((s) => (
                <SettingInline
                  key={s.code}
                  setting={s}
                  saving={saving}
                  usage={settingUsage.get(s.code) ?? 1}
                  onSave={(value) => onSaveSetting(s, value)}
                  onHistory={() => onSettingHistory(s)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p onClick={open} className="mt-1 cursor-text whitespace-pre-wrap break-words text-sm leading-relaxed" title="Clic para editar">
          <Highlight text={block.content} query={query} />
        </p>
      )}
    </div>
  );
}
