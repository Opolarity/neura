import { useState } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { describeValue } from "../../adapters/chatbotBehavior.adapter";
import { renderWithSettings } from "../../adapters/chatbotConsiderations.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import Highlight from "./Highlight";

interface SettingChoiceProps {
  setting: ChatbotPromptSetting;
  variants: { value: string; text: string }[];
  settings: ChatbotPromptSetting[];
  query: string;
  saving: boolean;
  /** En cuántos párrafos aparece el ajuste (cambiarlo los cambia a todos). */
  usage: number;
  onSave: (value: string) => Promise<boolean>;
  onHistory: () => void;
}

/**
 * Las versiones de un párrafo, una por opción del ajuste. La que usa el bot va
 * marcada; un clic en otra la elige y se guarda ahí mismo.
 */
export default function SettingChoice({ setting, variants, settings, query, saving, usage, onSave, onHistory }: SettingChoiceProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const label = (v: string) => (setting.multiple ? describeValue(setting, v) : (setting.optionLabels[v] ?? v));
  const save = async () => {
    if (picked !== null && (await onSave(picked))) setPicked(null);
  };

  return (
    <div className="my-2 space-y-1.5 rounded-md border border-dashed border-primary/30 bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {setting.name}
          <span className="font-normal text-muted-foreground"> · elige la versión que usa el bot</span>
        </span>
        <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs text-muted-foreground" onClick={onHistory}>
          <History className="mr-1 h-3.5 w-3.5" /> Historial
        </Button>
      </div>
      <div role="radiogroup" aria-label={setting.name} className="space-y-1.5">
        {variants.map((v) => {
          const live = v.value === setting.published;
          const chosen = picked === null ? live : picked === v.value;
          const text = renderWithSettings(v.text, settings).trim();
          return (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={saving}
              onClick={() => setPicked(live ? null : v.value)}
              className={cn(
                "flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                chosen ? "border-primary bg-primary/5" : "border-border opacity-70 hover:opacity-100 hover:border-primary/40"
              )}
            >
              <span className={cn("mt-1 h-3.5 w-3.5 shrink-0 rounded-full border", chosen ? "border-[5px] border-primary" : "border-muted-foreground")} />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-foreground">
                  {label(v.value)}
                  {live && <Badge variant="success">La usa el bot</Badge>}
                  {picked === v.value && <Badge variant="warning">Sin guardar</Badge>}
                </span>
                <span className="block whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {text ? <Highlight text={text} query={query} /> : <em>No agrega nada: el bot sigue con lo demás.</em>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {usage > 1 ? `Este ajuste también cambia otros ${usage - 1} ${usage - 1 === 1 ? "párrafo" : "párrafos"}.` : "El bot lo usa en menos de un minuto."}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPicked(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
