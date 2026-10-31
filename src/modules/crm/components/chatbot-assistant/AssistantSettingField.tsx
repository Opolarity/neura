import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { currentValue, fromMultiValue, sameValue, toMultiValue } from "../../adapters/chatbotBehavior.adapter";
import { isDirtySetting } from "../../adapters/chatbotAssistant.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import StoreLocationsEditor from "../chatbot-behavior/StoreLocationsEditor";

interface Props {
  setting: ChatbotPromptSetting;
  saving: boolean;
  disabled: boolean;
  onSave: (value: string) => Promise<boolean>;
}

/** Hasta 3 opciones se eligen con botones; con más, en un desplegable. */
const MAX_TOGGLE_OPTIONS = 3;

/** La opción elegida en el morado de marca: el gris del Toggle base no se distingue. */
const OPCION_ELEGIDA =
  "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:data-[state=on]:bg-primary/90 hover:data-[state=on]:text-primary-foreground";

/**
 * Un ajuste del asistente. Las opciones cerradas se guardan al elegir; el
 * texto libre al salir del campo; las sedes con su botón. Siempre como
 * borrador hasta publicar.
 */
export const AssistantSettingField = ({ setting, saving, disabled, onSave }: Props) => {
  const value = currentValue(setting);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const id = `assistant-${setting.code}`;
  const options = setting.allowedValues.map((v) => ({ value: v, label: setting.optionLabels[v] ?? v }));
  const isOption = setting.type === "flow_option" && options.length > 0;
  const long = setting.type === "business_instructions" || (setting.maxCharacters ?? 0) > 200;
  const over = setting.maxCharacters !== null && text.length > setting.maxCharacters;

  const renderControl = () => {
    if (isOption && setting.multiple) {
      return (
        <ToggleGroup
          id={id}
          type="multiple"
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
          value={fromMultiValue(value)}
          disabled={disabled || saving}
          onValueChange={(vals) => void onSave(toMultiValue(setting, vals))}
        >
          {options.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} className={OPCION_ELEGIDA}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    }

    if (isOption && options.length <= MAX_TOGGLE_OPTIONS) {
      return (
        <ToggleGroup
          id={id}
          type="single"
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
          value={value}
          disabled={disabled || saving}
          onValueChange={(v) => v && void onSave(v)}
        >
          {options.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} className={OPCION_ELEGIDA}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    }

    if (isOption) {
      return (
        <Select value={value} disabled={disabled || saving} onValueChange={(v) => void onSave(v)}>
          <SelectTrigger id={id} className="w-full sm:w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (setting.type === "store_list") {
      const changed = !sameValue(setting, text, value);
      return (
        <div className="flex flex-col gap-2">
          <StoreLocationsEditor id={id} value={text} disabled={disabled || saving} onChange={setText} />
          {changed && !disabled && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setText(value)} disabled={saving}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => void onSave(text)} disabled={saving}>
                Guardar sedes
              </Button>
            </div>
          )}
        </div>
      );
    }

    const fieldProps = {
      id,
      value: text,
      disabled,
      onChange: (e: { target: { value: string } }) => setText(e.target.value),
      onBlur: () => !over && void onSave(text),
      className: over ? "border-destructive focus-visible:ring-destructive" : undefined,
    };

    return (
      <>
        {long ? (
          <Textarea rows={6} {...fieldProps} />
        ) : (
          <Input type={setting.type === "phone" ? "tel" : "text"} inputMode={setting.type === "phone" ? "numeric" : undefined} {...fieldProps} />
        )}
        {setting.maxCharacters !== null && (
          <p className={over ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {text.length} / {setting.maxCharacters}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{setting.name}</Label>
        {isDirtySetting(setting) && <span className="text-xs text-muted-foreground">Borrador</span>}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>
      {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
      {renderControl()}
    </div>
  );
};
