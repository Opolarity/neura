import type { CSSProperties } from "react";
import type { UserComponent } from "@craftjs/core";
import { ImageIcon } from "lucide-react";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import { useEditor, useNode } from "@craftjs/core";
import { CONTEXT_IMAGES, useContextValues } from "../lib/context-values";
import { fieldOf } from "../../constants/printDataSources";
import { tableSourceOf, useDataRow } from "../lib/data-table";
import { PROPERTY_HELP } from "../lib/property-help";
import { useEditableNode } from "../lib/use-editable-node";
import { useNodeProps } from "../lib/use-node-props";
import { useParentDirection } from "../lib/use-parent-direction";
import { useFreeOrigin } from "../lib/use-free-origin";
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
import { SelectField } from "./settings-fields";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";

/** Cómo entra la imagen en su caja. */
export type ImageFit = "contain" | "cover" | "fill";

const FIT_OPTIONS: { value: ImageFit; label: string }[] = [
  { value: "contain", label: "Entera" },
  { value: "cover", label: "Rellenar" },
  { value: "fill", label: "Estirar" },
];

/** Lo propio de la Imagen. */
interface ImageContentProps {
  /**
   * De dónde sale: vacío, de `src`; si no, la clave de una imagen de la
   * configuración (CONTEXT_IMAGES), como el logo del comprobante.
   */
  imageKey: string;
  /** La dirección (URL) de la imagen, si no sale de la configuración. */
  src: string;
  fit: ImageFit;
  /**
   * En la fila de una Tabla de datos: el campo de imagen de la fuente que
   * muestra (la dirección sale del registro y no se elige). Vacío = una
   * Imagen normal.
   */
  field: string;
  /** Parte de una Tabla de datos: no se mueve, copia ni elimina. */
  locked: boolean;
}

export interface PdfImageProps
  extends
    ImageContentProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {}

const DEFAULT_PROPS: PdfImageProps = {
  imageKey: "",
  src: "",
  fit: "contain",
  field: "",
  locked: false,
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  // Una caja fija: la imagen entra en ella sin deformarse.
  widthMode: "fixed",
  widthMm: 30,
  heightMode: "fixed",
  heightMm: 20,
  ...DEFAULT_SPACING,
  ...DEFAULT_APPEARANCE,
  background: "rgba(255, 255, 255, 0)",
  ...DEFAULT_BORDER,
};

/** En el panel, «Seleccionar»: la imagen sale de su URL. */
const MANUAL_ORIGIN = "manual";

/** Cualquier texto vale como dirección; vacío, sin imagen. */
const validateUrl = (text: string) => ({ value: text.trim() });

export const PdfImage: UserComponent<Partial<PdfImageProps>> = (props) => {
  const p = { ...DEFAULT_PROPS, ...props };
  const { ref, outline, enabled, nodeProps } = useEditableNode();
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();
  const contextValue = useContextValues();
  // En la fila de una Tabla: la imagen de su registro.
  const dataRow = useDataRow();
  const rowValue = p.field ? dataRow?.row[p.field] : undefined;
  const source = p.field
    ? typeof rowValue === "string"
      ? rowValue
      : ""
    : p.imageKey
      ? contextValue("business", p.imageKey)
      : p.src;

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
    // Sin imagen, fuera del editor (vista previa, solo ver, impresión) no
    // ocupa lugar: un tenant sin logo no deja un hueco.
    ...(!source && !enabled && { display: "none" }),
  };

  return (
    <div ref={ref} style={style} {...nodeProps}>
      {source ? (
        <img
          src={source}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: p.fit,
          }}
        />
      ) : (
        // Sin imagen: en el editor se ve dónde va; al imprimir, nada.
        enabled && (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-muted-foreground/50 text-muted-foreground"
            style={{ fontSize: "8pt" }}
          >
            <ImageIcon className="h-4 w-4" />
            {p.imageKey ? "Sin configurar" : "Imagen"}
          </div>
        )
      )}
    </div>
  );
};

function PdfImageSettings() {
  const { props, set } = useNodeProps<PdfImageProps>(DEFAULT_PROPS);
  const { id } = useNode();
  const { source } = useEditor((state) => ({
    source: tableSourceOf(state.nodes, id),
  }));
  const tableField =
    props.field && source ? fieldOf(source, props.field) : null;

  return (
    <div className="flex flex-col">
      {/* Lo propio del componente: sin nombre, se sobreentiende. */}
      <PropertySection>
        {props.field ? (
          // En una Tabla: la imagen de su columna, no se elige.
          <SelectField
            label="Origen"
            help={PROPERTY_HELP.tableImageOrigin}
            value="table"
            options={[
              {
                value: "table",
                label: `Valor de tabla: ${tableField?.label ?? props.field}`,
              },
            ]}
            onChange={() => undefined}
            disabled
          />
        ) : (
          <>
            <SelectField
              label="Origen"
              help={PROPERTY_HELP.imageOrigin}
              value={props.imageKey || MANUAL_ORIGIN}
              options={[
                { value: MANUAL_ORIGIN, label: "Seleccionar" },
                ...CONTEXT_IMAGES.map((item) => ({
                  value: item.key,
                  label: item.label,
                  group: "Configuración",
                })),
              ]}
              onChange={(value) =>
                set("imageKey", value === MANUAL_ORIGIN ? "" : value)
              }
            />
            {!props.imageKey && (
              <PanelField
                label={
                  <HelpLabel
                    label="URL de la imagen"
                    help={PROPERTY_HELP.imageUrl}
                  />
                }
              >
                {(id) => (
                  <CommitInput
                    id={id}
                    value={props.src}
                    validate={validateUrl}
                    onCommit={(value) => set("src", value)}
                    placeholder="https://..."
                    className="h-8 text-[12px] md:text-[12px]"
                  />
                )}
              </PanelField>
            )}
          </>
        )}
        <SelectField
          label="Ajuste"
          help={PROPERTY_HELP.imageFit}
          value={props.fit}
          options={FIT_OPTIONS}
          onChange={(value) => set("fit", value)}
        />
      </PropertySection>
      {!props.locked && <PositionSection props={props} set={set} />}
      <SizeSection props={props} set={set} />
      <SpacingSection props={props} set={set} />
      <AppearanceSection props={props} set={set} />
      <BorderSection props={props} set={set} />
    </div>
  );
}

PdfImage.craft = {
  displayName: "Imagen",
  props: DEFAULT_PROPS,
  rules: {
    // Dentro de una Tabla de datos no se arrastra.
    canDrag: (node) => !node.data.props.locked,
    // La imagen no recibe otros componentes dentro.
    canMoveIn: () => false,
  },
  related: {
    settings: PdfImageSettings,
  },
};
