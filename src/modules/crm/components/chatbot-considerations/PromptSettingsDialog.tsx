import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { currentValue, sameValue } from "../../adapters/chatbotBehavior.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import PromptSettingField from "../chatbot-behavior/PromptSettingField";

interface PromptSettingsDialogProps {
  settings: ChatbotPromptSetting[];
  saving: boolean;
  onClose: () => void;
  onSave: (setting: ChatbotPromptSetting, value: string) => Promise<boolean>;
  onHistory: (setting: ChatbotPromptSetting) => void;
}

/**
 * Los ajustes que nombra un párrafo técnico (sedes, números, trato…). Cada uno
 * se guarda solo y queda vivo, igual que un párrafo.
 */
export default function PromptSettingsDialog({ settings, saving, onClose, onSave, onHistory }: PromptSettingsDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(Object.fromEntries(settings.map((s) => [s.code, currentValue(s)])));
  }, [settings]);

  return (
    <Dialog open={settings.length > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajustes de este párrafo</DialogTitle>
          <DialogDescription>El texto lo usa el sistema; estos datos sí se cambian acá. Al guardar, el bot los usa en menos de un minuto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto pr-1">
          {settings.map((s) => {
            const value = values[s.code] ?? "";
            return (
              <div key={s.code} className="space-y-2">
                <PromptSettingField
                  setting={s}
                  value={value}
                  disabled={saving}
                  onChange={(v) => setValues((prev) => ({ ...prev, [s.code]: v }))}
                  onHistory={() => onHistory(s)}
                />
                <div className="flex justify-end">
                  <Button size="sm" disabled={saving || sameValue(s, value, s.published)} onClick={() => onSave(s, value)}>
                    Guardar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
