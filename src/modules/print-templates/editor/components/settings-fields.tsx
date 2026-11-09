import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { cn } from "@/shared/utils/utils";
import type { Validator } from "../lib/validators";
import { ColorField } from "./color-field";
import { CommitInput } from "./commit-input";
import { HelpLabel } from "./help-label";
import { UnitText } from "./unit-text";

// Controles del panel de propiedades, con el formato de la skill
// editor-panel-propiedades: labels a 11px, controles h-8 a 12px.
const INPUT_CLASS = "h-8 text-[12px] md:text-[12px]";

/**
 * Número con su unidad dibujada dentro del campo. Es un CommitInput: la
 * validación (y si admite vacío) la decide quien lo usa.
 */
export function NumberField<T extends number | null>({
  label,
  value,
  validate,
  onChange,
  unit = "mm",
  placeholder,
  help,
}: {
  label: string;
  value: T;
  validate: Validator<T>;
  onChange: (value: T) => void;
  unit?: string;
  placeholder?: string;
  /** Qué hace la propiedad, en el icono de ayuda (lib/property-help). */
  help?: string;
}) {
  return (
    <PanelField label={<HelpLabel label={label} help={help} />}>
      {(id) => (
        <div className="relative">
          <CommitInput
            id={id}
            inputMode="decimal"
            value={value}
            validate={validate}
            onCommit={onChange}
            placeholder={placeholder}
            className={cn(INPUT_CLASS, unit && "pr-9")}
          />
          {unit && (
            <UnitText
              unit={unit}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            />
          )}
        </div>
      )}
    </PanelField>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  help,
  disabled = false,
}: {
  label: string;
  value: T;
  /**
   * Las opciones con `group` salen bajo su nombre, en el orden en que
   * aparecen; las que no lo tienen, antes. Se elige una sola.
   */
  options: readonly { value: T; label: string; group?: string }[];
  onChange: (value: T) => void;
  help?: string;
  /** Se ve, pero no se cambia aquí. */
  disabled?: boolean;
}) {
  const item = (option: { value: T; label: string }) => (
    <SelectItem key={option.value} value={option.value} className="text-[12px]">
      {option.label}
    </SelectItem>
  );
  const groups = [
    ...new Set(
      options.flatMap((option) => (option.group ? [option.group] : [])),
    ),
  ];
  return (
    <PanelField label={<HelpLabel label={label} help={help} />}>
      {(id) => (
        <Select
          value={value}
          onValueChange={(next) => onChange(next as T)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="h-8 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Los SelectItem viven en un portal: el tamaño va uno a uno. */}
            {options.filter((option) => !option.group).map(item)}
            {groups.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel className="text-[11px] text-muted-foreground">
                  {group}
                </SelectLabel>
                {options.filter((option) => option.group === group).map(item)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </PanelField>
  );
}

/** Una propiedad de sí o no: su nombre (con ayuda) y un switch a la derecha. */
export function SwitchField({
  label,
  checked,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <FieldLabel htmlFor={id} help={help}>
        {label}
      </FieldLabel>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ColorPropertyField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel help={help}>{label}</FieldLabel>
      <ColorField value={value} onChange={onChange} />
    </div>
  );
}
