import { useEffect, useState, type CSSProperties } from "react";
import type { UserComponent } from "@craftjs/core";
import JsBarcode from "jsbarcode";
import { Barcode } from "lucide-react";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import {
  PRINT_DATA_SOURCES,
  type PrintDataSourceId,
} from "../../constants/printDataSources";
import { useSourceValue } from "../lib/print-data";
import { useDataSources } from "../lib/data-table";
import { PROPERTY_HELP } from "../lib/property-help";
import { useEditableNode } from "../lib/use-editable-node";
import { useNodeProps } from "../lib/use-node-props";
import { useParentDirection } from "../lib/use-parent-direction";
import { useFreeOrigin } from "../lib/use-free-origin";
import { numberRule } from "../lib/validators";
import {
  appearanceStyle,
  borderStyle,
  DEFAULT_APPEARANCE,
  DEFAULT_BORDER,
  DEFAULT_POSITION,
  DEFAULT_SIZE,
  DEFAULT_SPACING,
  positionStyle,
  sizeStyle,
  spacingStyle,
  type AppearanceProps,
  type BorderProps,
  type PositionProps,
  type SizeProps,
  type SpacingProps,
} from "../lib/style-props";
import { CommitInput } from "./commit-input";
import { HelpLabel } from "./help-label";
import { PropertySection } from "./property-section";
import { NumberField, SelectField, SwitchField } from "./settings-fields";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";

/**
 * Lo propio del Código de barras: lo que configura hoy la etiqueta de código
 * de barras (generateBarcodePdf): CODE128, sin el valor escrito debajo y sin
 * margen, estirado a la caja.
 */
interface BarcodeContentProps {
  /**
   * De dónde sale lo que codifica: vacío, de `content`; si no, la fuente del
   * documento y su valor de código de barras (PrintDataField.kind).
   */
  valueSource: PrintDataSourceId | "";
  valueKey: string;
  /** Lo que codifica, escrito, si no sale del documento. */
  content: string;
  /** El valor escrito debajo de las barras. */
  showValue: boolean;
  /** El espacio en blanco a cada lado de las barras, en barras. */
  quietZone: number;
}

export interface PdfBarcodeProps
  extends
    BarcodeContentProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {}

const DEFAULT_PROPS: PdfBarcodeProps = {
  valueSource: "",
  valueKey: "",
  content: "",
  // Como la etiqueta de hoy: sin el valor debajo y sin margen.
  showValue: false,
  quietZone: 0,
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  widthMode: "fixed",
  widthMm: 40,
  heightMode: "fixed",
  heightMm: 10,
  ...DEFAULT_SPACING,
  ...DEFAULT_APPEARANCE,
  background: "rgba(255, 255, 255, 0)",
  ...DEFAULT_BORDER,
};

/** En el panel, «Seleccionar»: lo que codifica se escribe. */
const MANUAL_ORIGIN = "manual";

const validateQuietZone = numberRule({ min: 0, max: 20, integer: true });

/** Cualquier texto vale; vacío, sin código. */
const validateContent = (text: string) => ({ value: text });

/**
 * Las barras de lo que diga `content`, como imagen (data URL), o null si no
 * se puede (vacío, o un carácter que CODE128 no admite). Con las opciones de
 * la etiqueta de hoy: barras de 1,5 px y 30 px de alto, que luego se estiran
 * a la caja.
 */
function useBarcodeImage(
  content: string,
  showValue: boolean,
  quietZone: number,
) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!content) {
      setImage(null);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, content, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: showValue,
        margin: quietZone,
      });
      setImage(canvas.toDataURL("image/png"));
    } catch {
      setImage(null);
    }
  }, [content, showValue, quietZone]);
  return image;
}

export const PdfBarcode: UserComponent<Partial<PdfBarcodeProps>> = (props) => {
  const p = { ...DEFAULT_PROPS, ...props };
  const { ref, outline, enabled, nodeProps } = useEditableNode();
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();
  // Del documento: en el editor, el de ejemplo de su fuente.
  const sourceValue = useSourceValue();
  const source = p.valueSource ? PRINT_DATA_SOURCES[p.valueSource] : null;
  const fromSource = sourceValue(source, p.valueKey);
  const content = source
    ? fromSource === null || fromSource === undefined
      ? ""
      : String(fromSource)
    : p.content.trim();
  const image = useBarcodeImage(content, p.showValue, p.quietZone);

  const style: CSSProperties = {
    boxSizing: "border-box",
    minWidth: 0,
    overflow: "hidden",
    ...sizeStyle(p, parentDirection, p.positionFree),
    ...spacingStyle(p),
    ...positionStyle(p, freeOrigin),
    ...appearanceStyle(p),
    ...borderStyle(p),
    ...outline,
    // Sin contenido, fuera del editor no ocupa lugar.
    ...(!content && !enabled && { display: "none" }),
  };

  return (
    <div ref={ref} style={style} {...nodeProps}>
      {image ? (
        // Estirado a la caja, como hoy.
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
        />
      ) : (
        enabled && (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 border border-dashed border-muted-foreground/50 text-muted-foreground"
            style={{ fontSize: "7pt" }}
          >
            <Barcode className="h-4 w-4" />
            {content ? "Valor no válido" : "Código de barras"}
          </div>
        )
      )}
    </div>
  );
};

function PdfBarcodeSettings() {
  const { props, set } = useNodeProps<PdfBarcodeProps>(DEFAULT_PROPS);
  // Los valores de código de barras de las fuentes del documento.
  const barcodeOptions = useDataSources().flatMap((source) =>
    (source.values ?? [])
      .filter((field) => field.kind === "barcode")
      .map((field) => ({
        value: `${source.id}:${field.key}`,
        label: field.label,
        group: source.label,
      })),
  );
  const current = props.valueSource
    ? `${props.valueSource}:${props.valueKey}`
    : MANUAL_ORIGIN;

  return (
    <div className="flex flex-col">
      {/* Lo propio del componente: sin nombre, se sobreentiende. */}
      <PropertySection>
        <SelectField
          label="Origen"
          help={PROPERTY_HELP.barcodeOrigin}
          value={current}
          options={[
            { value: MANUAL_ORIGIN, label: "Seleccionar" },
            ...barcodeOptions,
          ]}
          onChange={(value) => {
            if (value === MANUAL_ORIGIN) {
              set("valueSource", "");
              set("valueKey", "");
              return;
            }
            const [sourceId, key] = value.split(":");
            set("valueSource", sourceId as PrintDataSourceId);
            set("valueKey", key);
          }}
        />
        {!props.valueSource && (
          <PanelField
            label={
              <HelpLabel
                label="Contenido"
                help={PROPERTY_HELP.barcodeContent}
              />
            }
          >
            {(id) => (
              <CommitInput
                id={id}
                value={props.content}
                validate={validateContent}
                onCommit={(value) => set("content", value)}
                placeholder="Ej.: POL-001"
                className="h-8 text-[12px] md:text-[12px]"
              />
            )}
          </PanelField>
        )}
        <SwitchField
          label="Mostrar el valor"
          help={PROPERTY_HELP.barcodeShowValue}
          checked={props.showValue}
          onChange={(value) => set("showValue", value)}
        />
        <NumberField
          label="Margen del código"
          help={PROPERTY_HELP.barcodeQuietZone}
          unit=""
          value={props.quietZone}
          validate={validateQuietZone}
          onChange={(value) => set("quietZone", value)}
        />
      </PropertySection>
      <PositionSection props={props} set={set} />
      <SizeSection props={props} set={set} />
      <SpacingSection props={props} set={set} />
      <AppearanceSection props={props} set={set} />
      <BorderSection props={props} set={set} />
    </div>
  );
}

PdfBarcode.craft = {
  displayName: "Código de barras",
  props: DEFAULT_PROPS,
  rules: {
    // El código de barras no recibe otros componentes dentro.
    canMoveIn: () => false,
  },
  related: {
    settings: PdfBarcodeSettings,
  },
};
