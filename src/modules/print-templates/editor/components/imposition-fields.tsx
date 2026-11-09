import { useState } from "react";
import type {
  Imposition,
  ImpositionOrder,
  ImpositionPreset,
  PaperHeight,
} from "../../types/printTemplates.types";
import { formatPaper } from "../../utils/formatPaper";
import {
  MAX_COLUMNS,
  MAX_COPIES,
  MAX_SPACE_MM,
  sameColumns,
  sheetWidthMm,
} from "../lib/imposition";
import { PROPERTY_HELP } from "../lib/property-help";
import { numberRule } from "../lib/validators";
import { NumberField, SelectField } from "./settings-fields";

/** La opción de «Papel» que deja escribir columnas, separación y márgenes. */
const CUSTOM_LAYOUT = "custom";

const validateColumns = numberRule({ min: 1, max: MAX_COLUMNS, integer: true });
const validateCopies = numberRule({ min: 1, max: MAX_COPIES, integer: true });
const validateSpace = numberRule({ min: 0, max: MAX_SPACE_MM });

const ORDER_OPTIONS: readonly { value: ImpositionOrder; label: string }[] = [
  { value: "collated", label: "Intercalado (1, 2, 1, 2)" },
  { value: "grouped", label: "Agrupado (1, 1, 2, 2)" },
];

/**
 * Los ajustes de impresión (lib/imposition): cómo se acomoda la hoja que se
 * diseña en el papel, en columnas y copias. Los usan «Impresión», en la barra
 * del editor, y la Nueva plantilla. Abajo, cómo queda la hoja impresa.
 */
export function ImpositionFields({
  value,
  onChange,
  presets,
  pageWidthMm,
  pageHeightMm,
  multiPage,
}: {
  value: Imposition;
  onChange: (value: Imposition) => void;
  /** Los papeles recomendados de su plantilla del sistema. */
  presets?: readonly ImpositionPreset[];
  /** La hoja que se diseña: con ella se calcula la impresa. */
  pageWidthMm: number;
  pageHeightMm: PaperHeight;
  /** El orden de las copias solo importa con varias páginas. */
  multiPage: boolean;
}) {
  const set = <K extends keyof Imposition>(key: K, next: Imposition[K]) =>
    onChange({ ...value, [key]: next });
  const current =
    presets?.findIndex((preset) => sameColumns(preset.imposition, value)) ?? -1;
  // Con papeles recomendados, las columnas, la separación y los márgenes se
  // escriben solo en «Personalizado» (como el ancho y el alto de la Hoja).
  const [custom, setCustom] = useState(false);
  const hasPresets = Boolean(presets?.length);
  const showLayout = !hasPresets || custom || current < 0;
  const instances = value.columns * value.copies;

  return (
    <div className="flex flex-col">
      {presets && presets.length > 0 && (
        <SelectField
          label="Papel"
          help={PROPERTY_HELP.impositionPreset}
          value={showLayout ? CUSTOM_LAYOUT : String(current)}
          options={[
            ...presets.map((preset, index) => ({
              value: String(index),
              label: preset.label,
              group: "Recomendados",
            })),
            { value: CUSTOM_LAYOUT, label: "Personalizado" },
          ]}
          onChange={(next) => {
            // «Personalizado» arranca con el papel de ahora.
            setCustom(next === CUSTOM_LAYOUT);
            const preset = presets[Number(next)];
            if (next !== CUSTOM_LAYOUT && preset)
              onChange({ ...value, ...preset.imposition });
          }}
        />
      )}
      {showLayout && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Columnas"
              help={PROPERTY_HELP.impositionColumns}
              unit=""
              value={value.columns}
              validate={validateColumns}
              onChange={(next) => set("columns", next)}
            />
            {value.columns > 1 && (
              <NumberField
                label="Separación"
                help={PROPERTY_HELP.impositionGap}
                value={value.gapMm}
                validate={validateSpace}
                onChange={(next) => set("gapMm", next)}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Margen izquierdo"
              help={PROPERTY_HELP.impositionMarginLeft}
              value={value.marginLeftMm}
              validate={validateSpace}
              onChange={(next) => set("marginLeftMm", next)}
            />
            <NumberField
              label="Margen derecho"
              help={PROPERTY_HELP.impositionMarginRight}
              value={value.marginRightMm}
              validate={validateSpace}
              onChange={(next) => set("marginRightMm", next)}
            />
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Copias"
          help={PROPERTY_HELP.impositionCopies}
          unit=""
          value={value.copies}
          validate={validateCopies}
          onChange={(next) => set("copies", next)}
        />
        {multiPage && value.copies > 1 && (
          <SelectField
            label="Orden"
            help={PROPERTY_HELP.impositionOrder}
            value={value.order}
            options={ORDER_OPTIONS}
            onChange={(next) => set("order", next)}
          />
        )}
      </div>
      <p className="px-0.5 pt-1 text-[11px] leading-snug text-muted-foreground">
        Hoja impresa:{" "}
        {formatPaper(sheetWidthMm(pageWidthMm, value), pageHeightMm)}
        {instances > 1 &&
          ` · ${instances} veces el documento${
            value.copies > 1 && !multiPage ? `, ${value.copies} hojas` : ""
          }`}
      </p>
    </div>
  );
}
