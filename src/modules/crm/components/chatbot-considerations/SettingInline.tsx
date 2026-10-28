import { useState } from "react";
import { History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeValue, sameValue } from "../../adapters/chatbotBehavior.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import PromptSettingField from "../chatbot-behavior/PromptSettingField";

interface SettingInlineProps {
  setting: ChatbotPromptSetting;
  saving: boolean;
  /** En cuántos párrafos aparece el ajuste (cambiarlo los cambia a todos). */
  usage: number;
  onSave: (value: string) => Promise<boolean>;
  onHistory: () => void;
}

/**
 * Un dato que nombra un párrafo técnico (sedes, números, palabras…): se ve su
 * valor y, con "Cambiar", se edita ahí mismo, debajo del texto.
 */
export default function SettingInline({ setting, saving, usage, onSave, onHistory }: SettingInlineProps) {
  const [value, setValue] = useState<string | null>(null);
  const save = async () => {
    if (value !== null && (await onSave(value))) setValue(null);
  };

  if (value === null) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-md border border-dashed border-primary/30 bg-background px-2.5 py-1.5">
        <p className="min-w-0 text-xs">
          <span className="font-semibold text-foreground">{setting.name}: </span>
          <span className="line-clamp-2 block text-muted-foreground">{describeValue(setting, setting.published)}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onHistory} title="Historial">
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setValue(setting.published)} disabled={saving}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Cambiar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-primary/40 bg-background p-2.5">
      <PromptSettingField setting={setting} value={value} disabled={saving} onChange={setValue} onHistory={onHistory} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {usage > 1 ? `Este dato también cambia otros ${usage - 1} ${usage - 1 === 1 ? "párrafo" : "párrafos"}.` : "El bot lo usa en menos de un minuto."}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setValue(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={saving || sameValue(setting, value, setting.published)}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
