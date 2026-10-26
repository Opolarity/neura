import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { currentValue, fromMultiValue, toMultiValue } from "../../adapters/chatbotBehavior.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";

interface PromptSettingFieldProps {
  setting: ChatbotPromptSetting;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onHistory: () => void;
}

/** Un ajuste del prompt: el campo según su tipo, su estado (sin guardar / sin publicar) y el historial. */
export default function PromptSettingField({ setting, value, disabled, onChange, onHistory }: PromptSettingFieldProps) {
  const id = `setting-${setting.code}`;
  const unsaved = value !== currentValue(setting);
  const unpublished = !unsaved && setting.draft !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id} className="text-sm font-semibold">
            {setting.name}
          </Label>
          {unsaved && <Badge variant="warning">Sin guardar</Badge>}
          {unpublished && <Badge variant="info">Sin publicar</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={onHistory} className="h-7 px-2 text-muted-foreground">
          <History className="w-4 h-4 mr-1" />
          Historial
        </Button>
      </div>
      {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}

      {setting.type === "vocabulary" && (
        <Input
          id={id}
          value={value}
          maxLength={setting.maxCharacters ?? undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-sm"
        />
      )}

      {setting.type === "flow_option" && !setting.multiple && (
        <RadioGroup id={id} value={value} onValueChange={onChange} disabled={disabled} className="gap-2">
          {setting.allowedValues.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`${id}-${v}`} />
              <Label htmlFor={`${id}-${v}`} className="font-normal">
                {setting.optionLabels[v] ?? v}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {setting.type === "flow_option" && setting.multiple && (
        <div id={id} className="flex flex-col gap-2">
          {setting.allowedValues.map((v) => {
            const selected = fromMultiValue(value);
            return (
              <div key={v} className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${v}`}
                  checked={selected.includes(v)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange(toMultiValue(setting, checked ? [...selected, v] : selected.filter((x) => x !== v)))
                  }
                />
                <Label htmlFor={`${id}-${v}`} className="font-normal">
                  {setting.optionLabels[v] ?? v}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {setting.type === "business_instructions" && (
        <div className="space-y-1">
          <Textarea
            id={id}
            value={value}
            maxLength={setting.maxCharacters ?? undefined}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder={"Ej.: Trato de usted.\nEsta semana destaca la línea de joggers.\nNo ofrezcas las cuotas salvo que pregunten."}
          />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>Sin precios, sin links de otras páginas y sin líneas que empiecen con #.</span>
            {setting.maxCharacters && (
              <span>
                {value.length} / {setting.maxCharacters}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
