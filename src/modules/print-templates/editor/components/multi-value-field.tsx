import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import { cn } from "@/shared/utils/utils";
import type { Validator } from "../lib/validators";
import { CommitInput } from "./commit-input";
import { HelpLabel } from "./help-label";
import { UnitText } from "./unit-text";
import { EditorTooltip } from "./editor-tooltip";

const INPUT_CLASS = "h-full min-w-0 text-[12px] md:text-[12px] tabular-nums";

/**
 * Los addons (unidad, icono) se separan del campo con una línea de alto
 * completo, como la opacidad en el campo de color.
 */
const ADDON_CLASS = "h-full self-stretch border-input py-0";

const MIXED = "Mixto";

/**
 * null = los valores difieren. Escribir "Mixto" con todos iguales no pasa la
 * validación numérica y el campo vuelve a su valor.
 */
const formatShared = (shared: number | null) =>
  shared === null ? MIXED : String(shared);

export interface MultiValueItem<K extends string> {
  key: K;
  /** Lo que dice el tooltip del icono. */
  label: string;
  icon: ReactNode;
}

/**
 * Una propiedad con varios valores del mismo tipo (las cuatro esquinas...).
 * El campo principal los cambia todos a la vez: muestra el valor si todos son
 * iguales y el texto "Mixto" si alguno difiere. "Mixto" no es un valor que se
 * pueda aplicar: dejarlo o escribirlo no cambia nada. El botón de al lado,
 * fuera del InputGroup porque es otra acción, despliega debajo un campo por valor, con su icono y su tooltip.
 * Todos son CommitInput con la validación que da quien lo usa. Los valores
 * de uso común (lados, esquinas) están en multi-value-items.
 */
export function MultiValueField<K extends string>({
  label,
  items,
  value,
  validate,
  onChange,
  toggleIcon,
  toggleLabel,
  unit = "mm",
  hideLabel = false,
  help,
}: {
  /** El nombre de la propiedad; con hideLabel solo lo leen los lectores de pantalla. */
  label: string;
  /** Sin etiqueta visible: la primera propiedad de una sección se sobreentiende. */
  hideLabel?: boolean;
  /** En el orden en que se despliegan, en dos columnas. */
  items: readonly MultiValueItem<K>[];
  value: Record<K, number>;
  validate: Validator<number>;
  onChange: (value: Record<K, number>) => void;
  toggleIcon: ReactNode;
  toggleLabel: string;
  unit?: string;
  /** Qué hace la propiedad, en el icono de ayuda (lib/property-help). */
  help?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const first = value[items[0].key];
  const shared = items.every(({ key }) => value[key] === first) ? first : null;

  const setAll = (amount: number) =>
    onChange(
      Object.fromEntries(items.map(({ key }) => [key, amount])) as Record<
        K,
        number
      >,
    );

  const field = (id?: string) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {/* El valor y su unidad en un grupo; el botón de desplegar va
            aparte porque es otra acción. */}
        <InputGroup className="h-8 min-w-0 flex-1">
          <CommitInput<number | null>
            as={InputGroupInput}
            id={id}
            aria-label={hideLabel ? label : undefined}
            inputMode="decimal"
            value={shared}
            format={formatShared}
            validate={validate}
            onCommit={(amount) => amount !== null && setAll(amount)}
            className={cn(INPUT_CLASS, "px-2")}
          />
          {unit && shared !== null && (
            <InputGroupAddon
              align="inline-end"
              className={cn(ADDON_CLASS, "border-l pl-2")}
            >
              <UnitText unit={unit} />
            </InputGroupAddon>
          )}
        </InputGroup>
        <EditorTooltip label={toggleLabel}>
          <Button
            type="button"
            variant={expanded ? "secondary" : "outline"}
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={toggleLabel}
            aria-expanded={expanded}
          >
            {toggleIcon}
          </Button>
        </EditorTooltip>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((item) => (
            <InputGroup key={item.key} className="h-8">
              <InputGroupAddon
                align="inline-start"
                className={cn(ADDON_CLASS, "border-r pl-2 pr-2")}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex">{item.icon}</span>
                  </TooltipTrigger>
                  <TooltipContent className="px-2 py-1 text-[11px]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </InputGroupAddon>
              <CommitInput
                as={InputGroupInput}
                inputMode="decimal"
                aria-label={`${label}: ${item.label.toLowerCase()}`}
                value={value[item.key]}
                validate={validate}
                onCommit={(amount) =>
                  onChange({ ...value, [item.key]: amount })
                }
                className={cn(INPUT_CLASS, "px-2")}
              />
            </InputGroup>
          ))}
        </div>
      )}
    </div>
  );

  return hideLabel ? (
    field()
  ) : (
    <PanelField label={<HelpLabel label={label} help={help} />}>
      {field}
    </PanelField>
  );
}
