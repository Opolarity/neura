import { useEffect, useState, type CSSProperties } from "react";
import type { UserComponent } from "@craftjs/core";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  WHITE,
  type AppearanceProps,
  type BorderProps,
  type PositionProps,
  type SizeProps,
  type SpacingProps,
} from "../lib/style-props";
import { HelpLabel } from "./help-label";
import { PropertySection } from "./property-section";
import { NumberField, SelectField } from "./settings-fields";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";

/**
 * Cuánto se puede dañar el código y seguir leyéndose: más, más denso. Los
 * comprobantes de hoy usan M (POSTicketPrintPage, invoiceTicketPdf).
 */
export type QrLevel = "L" | "M" | "Q" | "H";

const LEVEL_OPTIONS: { value: QrLevel; label: string }[] = [
  { value: "L", label: "Baja (7 %)" },
  { value: "M", label: "Media (15 %)" },
  { value: "Q", label: "Alta (25 %)" },
  { value: "H", label: "Máxima (30 %)" },
];

/** Lo propio del QR: lo que cambian los comprobantes de hoy. */
interface QrContentProps {
  /**
   * De dónde sale lo que codifica: vacío, de `content`; si no, la fuente del
   * documento y su valor de QR (PrintDataField.kind = "qr").
   */
  valueSource: PrintDataSourceId | "";
  valueKey: string;
  /** Lo que codifica, escrito, si no sale del documento. */
  content: string;
  /** El borde blanco alrededor del código, en módulos (cuadritos). */
  quietZone: number;
  level: QrLevel;
}

export interface PdfQrProps
  extends
    QrContentProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {}

const DEFAULT_PROPS: PdfQrProps = {
  valueSource: "",
  valueKey: "",
  content: "",
  // Como el QR de los comprobantes: margen de 1 módulo y corrección media.
  quietZone: 1,
  level: "M",
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  // Cuadrado y fijo: el código no se deforma.
  widthMode: "fixed",
  widthMm: 30,
  heightMode: "fixed",
  heightMm: 30,
  aspectLocked: true,
  aspectRatio: 1,
  ...DEFAULT_SPACING,
  ...DEFAULT_APPEARANCE,
  background: WHITE,
  ...DEFAULT_BORDER,
};

/** Resolución de la imagen del código, en px: nítida al imprimir. */
const QR_PIXELS = 512;

/** En el panel, «Seleccionar»: lo que codifica se escribe. */
const MANUAL_ORIGIN = "manual";

const validateQuietZone = numberRule({ min: 0, max: 10, integer: true });

/** Un QR de lo que diga `content`, como imagen (data URL), o null. */
function useQrImage(content: string, quietZone: number, level: QrLevel) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!content) {
      setImage(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(content, {
      width: QR_PIXELS,
      margin: quietZone,
      errorCorrectionLevel: level,
    })
      .then((url) => !cancelled && setImage(url))
      .catch(() => !cancelled && setImage(null));
    return () => {
      cancelled = true;
    };
  }, [content, quietZone, level]);
  return image;
}

export const PdfQr: UserComponent<Partial<PdfQrProps>> = (props) => {
  const p = { ...DEFAULT_PROPS, ...props };
  const { ref, outline, enabled, nodeProps } = useEditableNode();
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();
  // Del documento: en el editor, el de ejemplo de su fuente.
  const sourceValue = useSourceValue();
  const source = p.valueSource ? PRINT_DATA_SOURCES[p.valueSource] : null;
  const fromSource = sourceValue(source, p.valueKey);
  const content = source
    ? typeof fromSource === "string"
      ? fromSource
      : ""
    : p.content.trim();
  const image = useQrImage(content, p.quietZone, p.level);

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
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        enabled && (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-muted-foreground/50 text-muted-foreground"
            style={{ fontSize: "8pt" }}
          >
            <QrCode className="h-4 w-4" />
            QR
          </div>
        )
      )}
    </div>
  );
};

function PdfQrSettings() {
  const { props, set } = useNodeProps<PdfQrProps>(DEFAULT_PROPS);
  // Los valores de QR de las fuentes del documento (el del comprobante).
  const qrOptions = useDataSources().flatMap((source) =>
    (source.values ?? [])
      .filter((field) => field.kind === "qr")
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
          help={PROPERTY_HELP.qrOrigin}
          value={current}
          options={[
            { value: MANUAL_ORIGIN, label: "Seleccionar" },
            ...qrOptions,
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
              <HelpLabel label="Contenido" help={PROPERTY_HELP.qrContent} />
            }
          >
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={props.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="https://... o cualquier texto"
                className="text-[12px] md:text-[12px]"
              />
            )}
          </PanelField>
        )}
        <NumberField
          label="Margen del código"
          help={PROPERTY_HELP.qrQuietZone}
          unit=""
          value={props.quietZone}
          validate={validateQuietZone}
          onChange={(value) => set("quietZone", value)}
        />
        <SelectField
          label="Corrección de errores"
          help={PROPERTY_HELP.qrLevel}
          value={props.level}
          options={LEVEL_OPTIONS}
          onChange={(value) => set("level", value)}
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

PdfQr.craft = {
  displayName: "QR",
  props: DEFAULT_PROPS,
  rules: {
    // El QR no recibe otros componentes dentro.
    canMoveIn: () => false,
  },
  related: {
    settings: PdfQrSettings,
  },
};
