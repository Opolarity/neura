import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Italic,
  Strikethrough,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import {
  closestWeight,
  FONT_FAMILIES,
  FONT_OPTIONS,
  FONT_WEIGHT_NAMES,
  type FontWeight,
  type TextAlign,
  type TextCase,
  type TypographyProps,
} from "../lib/style-props";
import type { PropSetter } from "../lib/use-node-props";
import { PROPERTY_HELP } from "../lib/property-help";
import { numberRule } from "../lib/validators";
import { EditorTooltip } from "./editor-tooltip";
import {
  ColorPropertyField,
  NumberField,
  SelectField,
} from "./settings-fields";

/** Cursiva, subrayado y tachado: cada uno se prende y apaga solo. */
const STYLE_ITEMS: {
  key: "italic" | "underline" | "strikethrough";
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "italic", label: "Cursiva", icon: Italic },
  { key: "underline", label: "Subrayado", icon: Underline },
  { key: "strikethrough", label: "Tachado", icon: Strikethrough },
];

/** Cada opción se dibuja con un ejemplo de cómo deja el texto. */
const CASE_ITEMS: { value: TextCase; label: string; sample: ReactNode }[] = [
  { value: "none", label: "Como está escrito", sample: "Ab" },
  { value: "upper", label: "Todo en mayúsculas", sample: "AB" },
  { value: "lower", label: "Todo en minúsculas", sample: "ab" },
  {
    value: "capitalize",
    label: "Cada palabra con mayúscula inicial",
    sample: "Ab Cd",
  },
  {
    value: "smallCaps",
    label: "Versalitas (mayúsculas pequeñas)",
    sample: <span style={{ fontVariant: "small-caps" }}>Ab</span>,
  },
];

/** Tamaño e interlineado: mayores que 0, no se dejan vacíos. */
const validatePositive = numberRule({ positive: true });

/** Espacio entre letras: puede ser negativo (las junta); vacío = 0. */
const validateLetterSpacing = numberRule({ empty: 0 });

const ALIGN_ITEMS: { value: TextAlign; label: string; icon: LucideIcon }[] = [
  { value: "left", label: "Izquierda", icon: AlignLeft },
  { value: "center", label: "Centro", icon: AlignCenter },
  { value: "right", label: "Derecha", icon: AlignRight },
  { value: "justify", label: "Justificado", icon: AlignJustify },
];

/**
 * Fuente, peso, estilo (cursiva, subrayado, tachado), mayúsculas y
 * minúsculas, tamaño, interlineado, espacio entre letras, alineación y color. Son propiedades
 * únicas del Texto: van en su sección Contenido, debajo del texto, y no en
 * una sección propia. El peso solo ofrece los que tiene la fuente elegida.
 */
export function TypographyFields({
  props,
  set,
}: {
  props: TypographyProps;
  set: PropSetter<TypographyProps>;
}) {
  const weightOptions = FONT_FAMILIES[props.fontFamily].weights.map(
    (weight) => ({
      value: String(weight),
      label: FONT_WEIGHT_NAMES[weight],
    }),
  );

  return (
    <>
      <SelectField
        label="Fuente"
        help={PROPERTY_HELP.fontFamily}
        value={props.fontFamily}
        options={FONT_OPTIONS}
        onChange={(value) => {
          set("fontFamily", value);
          // Si la fuente nueva no tiene ese peso, queda en el más cercano.
          set("fontWeight", closestWeight(value, props.fontWeight));
        }}
      />
      <SelectField
        label="Peso"
        help={PROPERTY_HELP.fontWeight}
        value={String(props.fontWeight)}
        options={weightOptions}
        onChange={(value) => set("fontWeight", Number(value) as FontWeight)}
      />
      <div className="flex flex-col gap-1.5">
        <FieldLabel help={PROPERTY_HELP.textStyle}>Estilo</FieldLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={STYLE_ITEMS.filter(({ key }) => props[key]).map(
            ({ key }) => key,
          )}
          onValueChange={(values) => {
            for (const { key } of STYLE_ITEMS) {
              const on = values.includes(key);
              if (on !== props[key]) set(key, on);
            }
          }}
          className="justify-start"
        >
          {STYLE_ITEMS.map(({ key, label, icon: Icon }) => (
            <EditorTooltip key={key} label={label}>
              <ToggleGroupItem
                value={key}
                aria-label={label}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </EditorTooltip>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel help={PROPERTY_HELP.textCase}>
          Mayúsculas y minúsculas
        </FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          value={props.textCase}
          // Radix deja deseleccionar el activo: en ese caso no se cambia.
          onValueChange={(value) => value && set("textCase", value as TextCase)}
          className="justify-start"
        >
          {CASE_ITEMS.map(({ value, label, sample }) => (
            <EditorTooltip key={value} label={label}>
              <ToggleGroupItem
                value={value}
                aria-label={label}
                className="h-8 min-w-8 px-2 text-[12px]"
              >
                {sample}
              </ToggleGroupItem>
            </EditorTooltip>
          ))}
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Tamaño"
          help={PROPERTY_HELP.fontSize}
          unit="pt"
          value={props.fontSizePt}
          validate={validatePositive}
          onChange={(value) => set("fontSizePt", value)}
        />
        <NumberField
          label="Interlineado"
          help={PROPERTY_HELP.lineHeight}
          unit=""
          value={props.lineHeight}
          validate={validatePositive}
          onChange={(value) => set("lineHeight", value)}
        />
      </div>
      <NumberField
        label="Espacio entre letras"
        help={PROPERTY_HELP.letterSpacing}
        unit="pt"
        value={props.letterSpacingPt}
        validate={validateLetterSpacing}
        onChange={(value) => set("letterSpacingPt", value)}
      />
      <div className="flex flex-col gap-1.5">
        <FieldLabel help={PROPERTY_HELP.textAlign}>Alineación</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          value={props.align}
          // Radix deja deseleccionar el activo: en ese caso no se cambia.
          onValueChange={(value) => value && set("align", value as TextAlign)}
          className="justify-start"
        >
          {ALIGN_ITEMS.map(({ value, label, icon: Icon }) => (
            <EditorTooltip key={value} label={label}>
              <ToggleGroupItem
                value={value}
                aria-label={label}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </EditorTooltip>
          ))}
        </ToggleGroup>
      </div>
      <ColorPropertyField
        label="Color"
        help={PROPERTY_HELP.textColor}
        value={props.color}
        onChange={(value) => set("color", value)}
      />
    </>
  );
}
