import {
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Element,
  ROOT_NODE,
  useEditor,
  useNode,
  type UserComponent,
} from "@craftjs/core";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { formatPaper } from "../../utils/formatPaper";
import { usePaper } from "../lib/paper-context";
import { paperSizeKey } from "../lib/imposition";
import {
  PAGE_ZONE_LABEL,
  ALL_PAGES,
  PageCountContext,
  zoneFirstPage,
  zonePagesOf,
  type ZonePages,
  PageZoneContext,
  pageZoneId,
  pageZoneProps,
  ZONE_LABEL_ATTR,
  type PageZone,
} from "../lib/page-zones";
import { useDataRow } from "../lib/data-table";
import { numberRule } from "../lib/validators";
import type { Imposition, PaperPreset } from "../../types/printTemplates.types";
import {
  DEFAULT_HIDE_RULE,
  useHiddenByRule,
  useHideOrigins,
  type HideOrigin,
  type HideRuleProps,
} from "../lib/hide-rule";
import { PROPERTY_HELP } from "../lib/property-help";
import { useEditableNode } from "../lib/use-editable-node";
import { useNodeProps, type PropSetter } from "../lib/use-node-props";
import { useParentDirection } from "../lib/use-parent-direction";
import { useFreeOrigin } from "../lib/use-free-origin";
import { mm, PX_PER_MM, sidesToCss, type Sides } from "../lib/units";
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
  type FlexDirection,
  type PositionProps,
  type SizeProps,
  type SpacingProps,
} from "../lib/style-props";
import { PropertySection } from "./property-section";
import { NumberField, SelectField, SwitchField } from "./settings-fields";
import { GapField, type GapMode } from "./gap-field";
import { AlignmentField, type AxisAlign } from "./alignment-field";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";

/** Lo propio del Contenedor: cómo reparte a sus hijos. */
interface ContainerContentProps {
  direction: FlexDirection;
  /**
   * Dónde quedan los hijos, en horizontal y en vertical: no dependen de la
   * dirección, así al cambiarla no se mueven.
   */
  alignX: AxisAlign;
  alignY: AxisAlign;
  gapMode: GapMode;
  /** Solo se usa en `fixed`. */
  gapMm: number;
  /** Recortar contenido: lo que se sale de su caja no se ve. La Hoja ya recorta. */
  clipContent: boolean;
  /**
   * El pie de grupo de una Tabla de datos: recibe componentes (se repiten en
   * cada grupo) pero no se mueve ni se borra; se quita desde la Tabla.
   */
  groupFooterPart?: boolean;
  /**
   * En fila: lo que no entra a lo ancho pasa a la fila de abajo (con la misma
   * separación entre filas). Si uno se oculta, los siguientes se corren.
   */
  wrap?: boolean;
  /**
   * Con varias páginas: si no entra en lo que queda de la página, pasa entero
   * a la siguiente en vez de repartir lo que lleva («Conservar líneas juntas»
   * de Word). Si es más alto que una página, se parte igual.
   */
  keepTogether?: boolean;
}

export interface PdfContainerProps
  extends
    ContainerContentProps,
    HideRuleProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {
  /** La raíz: la Hoja. Ocupa el papel entero, sin tamaño ni margen exterior. */
  isPage: boolean;
  /**
   * Solo la Hoja de una plantilla con medidas elegibles: su medida, en mm
   * (lib/paper-context, paperOf).
   */
  paperWidthMm?: number;
  paperHeightMm?: number;
  /**
   * La última medida «Personalizada» de la Hoja: vuelve al elegir de nuevo
   * «Personalizada» después de una recomendada.
   */
  customPaper?: PaperSize;
  /**
   * «Recordar la impresión de cada medida» (en «Impresión»): cada medida de la
   * Hoja guarda la suya en impositionBySize (lib/imposition, paperSizeKey) y
   * vuelve al elegir esa medida. Apagado, una sola impresión para todas.
   */
  impositionPerSize?: boolean;
  impositionBySize?: Record<string, Imposition>;
  /**
   * Solo la Hoja, con varias páginas: si lleva encabezado y pie de página
   * (lib/page-zones) y en qué páginas sale cada uno (sin dato, en todas).
   */
  pageHeader?: boolean;
  pageFooter?: boolean;
  headerPages?: ZonePages;
  footerPages?: ZonePages;
  /**
   * El Contenedor del encabezado o del pie de página de la Hoja: sale arriba
   * o abajo de cada página. Vacío = un Contenedor normal.
   */
  pageZone: PageZone;
  /**
   * Solo la Hoja: cómo se acomoda en el papel al imprimir (columnas y
   * copias, lib/imposition). Se edita en «Impresión», en la barra de arriba.
   */
  imposition?: Imposition;
  /**
   * Parte de una Tabla de datos (lib/data-table): se le cambia el estilo, pero
   * no se mueve ni recibe ni suelta componentes.
   */
  locked: boolean;
  children?: ReactNode;
}

const DEFAULT_PROPS: Omit<PdfContainerProps, "children"> = {
  direction: "row",
  alignX: "start",
  alignY: "start",
  gapMode: "fixed",
  gapMm: 0,
  clipContent: false,
  wrap: false,
  keepTogether: false,
  ...DEFAULT_HIDE_RULE,
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  ...DEFAULT_SPACING,
  // Con margen interior se ve y se puede soltar algo dentro aunque esté vacío.
  padding: { top: 5, right: 5, bottom: 5, left: 5 },
  ...DEFAULT_APPEARANCE,
  ...DEFAULT_BORDER,
  isPage: false,
  locked: false,
  pageZone: "",
};

const DIRECTION_OPTIONS = [
  { value: "row", label: "Fila" },
  { value: "column", label: "Columna" },
] as const;

const FLEX_ALIGN: Record<AxisAlign, "flex-start" | "center" | "flex-end"> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
};

export const PdfContainer: UserComponent<Partial<PdfContainerProps>> = (
  props,
) => {
  const p = { ...DEFAULT_PROPS, ...props };
  const { ref, outline, enabled, nodeProps } = useEditableNode();
  // «Ocultar si está vacío»: fuera de la edición, sin su dato no se dibuja.
  const hidden = useHiddenByRule(p, enabled);
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();
  const paper = usePaper();
  // En la fila de una Tabla: su registro (y si va coloreada).
  const dataRow = useDataRow();
  // El encabezado o el pie de página: dónde va y si ya hay páginas para él.
  const zoneLayout = useContext(PageZoneContext);
  const pageCount = useContext(PageCountContext);
  const { empty } = useNode((node) => ({ empty: !node.data.nodes.length }));
  const zone =
    p.pageZone && zoneLayout && paper && paper.heightMm !== "auto"
      ? zonePlacement(p.pageZone, zoneLayout, paper.heightMm)
      : null;
  // El eje en que se reparte (el principal) y el otro, según la dirección.
  const isRow = p.direction === "row";
  const main = isRow ? p.alignX : p.alignY;
  const cross = isRow ? p.alignY : p.alignX;

  const style: CSSProperties = {
    display: "flex",
    flexDirection: p.direction,
    alignItems: FLEX_ALIGN[cross],
    // En auto la separación es el espacio libre repartido entre los hijos.
    ...(p.gapMode === "auto"
      ? { justifyContent: "space-between" }
      : { justifyContent: FLEX_ALIGN[main], gap: mm(p.gapMm) }),
    boxSizing: "border-box",
    minWidth: 0,
    ...(zone
      ? {
          // Fuera del reparto: arriba o abajo de su página, a lo ancho. Encima
          // de lo demás: una Tabla que sigue en esa página (es relative) la
          // tapaba y se quedaba con los clics.
          position: "absolute",
          zIndex: 2,
          left: mm(zone.left),
          right: mm(zone.right),
          top: zone.top,
          ...(zone.footer && { transform: "translateY(-100%)" }),
          padding: sidesToCss(p.padding),
          // Vacío, en el editor se ve dónde está.
          ...(enabled && empty && { minHeight: mm(6) }),
          ...(enabled && { outline: "1px dashed rgb(124 58 237 / 0.45)" }),
          // Si todavía no hay esa página, no sale (tampoco en el editor).
          ...(zone.firstPage >= pageCount && { display: "none" }),
        }
      : p.isPage
        ? // La Hoja es relative: los componentes libres se colocan en ella.
          // Con alto automático crece con su contenido: rellena la columna
          // que es el papel.
          {
            position: "relative",
            width: "100%",
            ...(paper?.heightMm === "auto" || paper?.multiPage
              ? { flexGrow: 1 }
              : { height: "100%" }),
            padding: sidesToCss(p.padding),
          }
        : {
            ...sizeStyle(p, parentDirection, p.positionFree),
            ...spacingStyle(p),
            ...positionStyle(p, freeOrigin),
          }),
    ...(p.clipContent && !p.isPage && { overflow: "hidden" }),
    ...(p.wrap && isRow && { flexWrap: "wrap" }),
    ...appearanceStyle(p),
    ...(hidden && { display: "none" }),
    // Una fila de una Tabla de datos con filas coloreadas.
    ...(p.locked && dataRow?.stripe && { background: dataRow.stripe }),
    ...borderStyle(p),
    ...outline,
  };

  return (
    <div ref={ref} style={style} {...nodeProps}>
      {zone && enabled && (
        // Qué zona es, fuera de ella: no se imprime ni se copia.
        <span
          {...{ [ZONE_LABEL_ATTR]: "" }}
          className="pointer-events-none absolute left-0 whitespace-nowrap text-violet-600"
          style={{
            fontSize: "6pt",
            ...(zone.footer ? { top: "100%" } : { bottom: "100%" }),
          }}
        >
          {PAGE_ZONE_LABEL[zone.kind]}
          {zone.note}
        </span>
      )}
      {p.isPage ? (
        <PageZoneContext.Provider
          value={{
            padding: p.padding,
            headerPages: zonePagesOf(p.headerPages),
            footerPages: zonePagesOf(p.footerPages),
          }}
        >
          {props.children}
        </PageZoneContext.Provider>
      ) : (
        props.children
      )}
    </div>
  );
};

/**
 * Dónde va una zona en la Hoja (px sin escalar desde arriba, y sus lados en
 * mm): en la primera página en que sale, dentro del margen interior; el pie,
 * pegado abajo.
 */
function zonePlacement(
  kind: Exclude<PageZone, "">,
  layout: { padding: Sides; headerPages: ZonePages; footerPages: ZonePages },
  pageHeightMm: number,
) {
  const footer = kind === "footer";
  const pages = footer ? layout.footerPages : layout.headerPages;
  const firstPage = zoneFirstPage(pages);
  const pageHeight = pageHeightMm * PX_PER_MM;
  const top = footer
    ? (firstPage + 1) * pageHeight - layout.padding.bottom * PX_PER_MM
    : firstPage * pageHeight + layout.padding.top * PX_PER_MM;
  return {
    kind,
    footer,
    firstPage,
    note: PAGES_NOTE[pages.mode](pages),
    top,
    left: layout.padding.left,
    right: layout.padding.right,
  };
}

/** La opción de «Medida» que deja escribir el ancho y el alto. */
const CUSTOM_PAPER = "custom";

const validatePaperMm = numberRule({ min: 10, max: 1000 });

/** Una medida de hoja, en mm. */
interface PaperSize {
  widthMm: number;
  heightMm: number;
}

/**
 * La medida de la Hoja en una plantilla con medidas elegibles: una de las
 * recomendadas o una personalizada, con su ancho y su alto. Cada una se
 * recuerda: al volver a «Personalizada» vuelve la última que se escribió.
 */
function PaperFields({
  widthMm,
  heightMm,
  presets,
  customPaper,
  onChange,
}: {
  widthMm: number;
  heightMm: number;
  presets: readonly PaperPreset[];
  /** La última personalizada (customPaper de la Hoja). */
  customPaper?: PaperSize;
  /** La medida nueva y, si es personalizada, también la que se recuerda. */
  onChange: (size: PaperSize, custom?: PaperSize) => void;
}) {
  const current = presets.findIndex(
    (preset) => preset.widthMm === widthMm && preset.heightMm === heightMm,
  );
  // «Personalizada» se elige aunque la medida sea la de una recomendada: solo
  // entonces se ven el ancho y el alto.
  const [custom, setCustom] = useState(current < 0);
  const showSize = custom || current < 0;
  return (
    <>
      <SelectField
        label="Medidas de la hoja"
        help={PROPERTY_HELP.paperPreset}
        value={showSize ? CUSTOM_PAPER : String(current)}
        options={[
          ...presets.map((preset, index) => ({
            value: String(index),
            label: preset.label,
            group: "Recomendadas",
          })),
          { value: CUSTOM_PAPER, label: "Personalizada" },
        ]}
        onChange={(value) => {
          setCustom(value === CUSTOM_PAPER);
          if (value === CUSTOM_PAPER) {
            // La última personalizada; la primera vez, la medida de ahora.
            const size = customPaper ?? { widthMm, heightMm };
            onChange(size, size);
            return;
          }
          const preset = presets[Number(value)];
          if (preset)
            onChange({ widthMm: preset.widthMm, heightMm: preset.heightMm });
        }}
      />
      {showSize && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ancho"
            help={PROPERTY_HELP.paperWidth}
            value={widthMm}
            validate={validatePaperMm}
            onChange={(value) => {
              const size = { widthMm: value, heightMm };
              onChange(size, size);
            }}
          />
          <NumberField
            label="Alto"
            help={PROPERTY_HELP.paperHeight}
            value={heightMm}
            validate={validatePaperMm}
            onChange={(value) => {
              const size = { widthMm, heightMm: value };
              onChange(size, size);
            }}
          />
        </div>
      )}
    </>
  );
}

/** En el panel, «Seleccionar»: sin dato elegido (se oculta siempre). */
const NO_ORIGIN = "none";

/**
 * «Ocultar si está vacío»: al activarlo, el dato (origen y valor) del que
 * depende. Al elegir un origen arranca con su primer valor.
 */
function HideRuleFields({
  props,
  set,
}: {
  props: HideRuleProps;
  set: PropSetter<HideRuleProps>;
}) {
  const { origins, valuesOf } = useHideOrigins();
  return (
    <>
      <SwitchField
        label="Ocultar si está vacío"
        help={PROPERTY_HELP.hideWhenEmpty}
        checked={props.hideWhenEmpty}
        onChange={(value) => set("hideWhenEmpty", value)}
      />
      {props.hideWhenEmpty && (
        <>
          <SelectField
            label="Origen"
            help={PROPERTY_HELP.hideSource}
            value={props.hideSource || NO_ORIGIN}
            options={[{ value: NO_ORIGIN, label: "Seleccionar" }, ...origins]}
            onChange={(value) => {
              const origin = (value === NO_ORIGIN ? "" : value) as HideOrigin;
              set("hideSource", origin);
              set("hideKey", valuesOf(origin)[0]?.value ?? "");
            }}
          />
          {props.hideSource && (
            <SelectField
              label="Valor"
              help={PROPERTY_HELP.hideKey}
              value={props.hideKey}
              options={valuesOf(props.hideSource)}
              onChange={(value) => set("hideKey", value)}
            />
          )}
        </>
      )}
    </>
  );
}

/** La nota de la etiqueta de la zona en el editor: en qué páginas sale. */
const PAGES_NOTE: Record<ZonePages["mode"], (pages: ZonePages) => string> = {
  all: () => "",
  from: (pages) => ` · desde la página ${pages.from}`,
  only: (pages) => ` · solo en la página ${pages.from}`,
  range: (pages) => ` · de la página ${pages.from} a la ${pages.to}`,
};

const PAGES_OPTIONS: readonly { value: ZonePages["mode"]; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "from", label: "Desde la página" },
  { value: "only", label: "Solo en la página" },
  { value: "range", label: "De la página … a la …" },
];

const validatePage = numberRule({ min: 1, max: 999, integer: true });

/** En qué páginas sale el encabezado o el pie, como las secciones de Word. */
function ZonePagesFields({
  value,
  onChange,
}: {
  value: ZonePages;
  onChange: (value: ZonePages) => void;
}) {
  return (
    <>
      <SelectField
        label="Páginas"
        help={PROPERTY_HELP.zonePages}
        value={value.mode}
        options={PAGES_OPTIONS}
        onChange={(mode) => onChange({ ...value, mode })}
      />
      {value.mode !== "all" && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label={value.mode === "range" ? "De la" : "Página"}
            unit=""
            value={value.from}
            validate={validatePage}
            onChange={(from) =>
              onChange({ ...value, from, to: Math.max(from, value.to) })
            }
          />
          {value.mode === "range" && (
            <NumberField
              label="A la"
              unit=""
              value={value.to}
              validate={validatePage}
              onChange={(to) =>
                onChange({ ...value, to, from: Math.min(value.from, to) })
              }
            />
          )}
        </div>
      )}
    </>
  );
}

/**
 * El encabezado y el pie de página en la Hoja: al encenderlos aparece su
 * Contenedor, vacío, para armarlo (no se borra); al apagarlos se quita con
 * lo que lleva. Cada uno dice en qué páginas sale.
 */
function PageZoneFields({
  props,
  set,
}: {
  props: PdfContainerProps;
  set: PropSetter<PdfContainerProps>;
}) {
  const { actions, query } = useEditor();
  const toggle = (kind: Exclude<PageZone, "">, value: boolean) => {
    set(kind === "header" ? "pageHeader" : "pageFooter", value);
    const id = pageZoneId(query.getNodes(), kind);
    if (!value) {
      if (id) actions.delete(id);
      return;
    }
    if (id) return;
    const tree = query
      .parseReactElement(
        <Element is={PdfContainer} canvas {...pageZoneProps(kind)} />,
      )
      .toNodeTree();
    const count = query.node(ROOT_NODE).get().data.nodes.length;
    actions.addNodeTree(tree, ROOT_NODE, kind === "header" ? 0 : count);
  };
  return (
    <>
      <SwitchField
        label="Encabezado de página"
        help={PROPERTY_HELP.pageHeader}
        checked={Boolean(props.pageHeader)}
        onChange={(value) => toggle("header", value)}
      />
      {props.pageHeader && (
        <ZonePagesFields
          value={zonePagesOf(props.headerPages ?? ALL_PAGES)}
          onChange={(value) => set("headerPages", value)}
        />
      )}
      <SwitchField
        label="Pie de página"
        help={PROPERTY_HELP.pageFooter}
        checked={Boolean(props.pageFooter)}
        onChange={(value) => toggle("footer", value)}
      />
      {props.pageFooter && (
        <ZonePagesFields
          value={zonePagesOf(props.footerPages ?? ALL_PAGES)}
          onChange={(value) => set("footerPages", value)}
        />
      )}
    </>
  );
}

function PdfContainerSettings() {
  const { props, set } = useNodeProps<PdfContainerProps>(DEFAULT_PROPS);
  const paper = usePaper();
  // El encabezado y el pie de página, y el pie de grupo de una Tabla: van
  // en su lugar, sin posición ni tamaño ni margen.
  const zone = Boolean(props.pageZone) || Boolean(props.groupFooterPart);

  return (
    <div className="flex flex-col">
      {/* Lo propio del componente: sin nombre, se sobreentiende. */}
      <PropertySection>
        {props.isPage && paper?.presets && (
          // Medidas elegibles: una recomendada o las que se escriban.
          <PaperFields
            widthMm={paper.widthMm}
            heightMm={paper.heightMm as number}
            presets={paper.presets}
            customPaper={props.customPaper}
            onChange={(size, custom) => {
              set("paperWidthMm", size.widthMm);
              set("paperHeightMm", size.heightMm);
              if (custom) set("customPaper", custom);
              if (!props.impositionPerSize) return;
              // Otra medida: deja guardada la impresión de la que se deja y
              // vuelve la de la nueva, si ya tiene.
              const from = paperSizeKey(
                paper.presets,
                paper.widthMm,
                paper.heightMm as number,
              );
              const to = paperSizeKey(
                paper.presets,
                size.widthMm,
                size.heightMm,
              );
              if (from === to) return;
              const bySize = {
                ...props.impositionBySize,
                [from]: paper.imposition,
              };
              set("impositionBySize", bySize);
              if (bySize[to]) set("imposition", bySize[to]);
            }}
          />
        )}
        {props.isPage && paper && !paper.presets && (
          // Las medidas las fija la plantilla del sistema: solo se muestran.
          <div className="flex flex-col gap-1.5">
            <FieldLabel help={PROPERTY_HELP.pageSize}>
              Medidas de la hoja
            </FieldLabel>
            <p className="text-[12px]">
              {formatPaper(paper.widthMm, paper.heightMm, paper.multiPage)}
            </p>
          </div>
        )}
        <SelectField
          label="Dirección"
          help={PROPERTY_HELP.direction}
          value={props.direction}
          options={DIRECTION_OPTIONS}
          onChange={(value) => set("direction", value)}
        />
        <AlignmentField
          direction={props.direction}
          autoGap={props.gapMode === "auto"}
          alignX={props.alignX}
          alignY={props.alignY}
          onChange={(x, y) => {
            set("alignX", x);
            set("alignY", y);
          }}
          onToggleAuto={(x, y) => {
            if (props.gapMode === "auto") {
              // Al salir de auto queda al inicio del eje en que se repartía
              // (arriba en columna, a la izquierda en fila), con el otro eje
              // como estaba.
              set("gapMode", "fixed");
              set("alignX", props.direction === "row" ? "start" : x);
              set("alignY", props.direction === "column" ? "start" : y);
            } else {
              set("gapMode", "auto");
              set("alignX", x);
              set("alignY", y);
            }
          }}
        />
        <GapField
          direction={props.direction}
          mode={props.gapMode}
          valueMm={props.gapMm}
          onChange={(mode, valueMm) => {
            set("gapMode", mode);
            set("gapMm", valueMm);
          }}
        />
        {props.direction === "row" && !props.locked && (
          <SwitchField
            label="Pasar a otra fila"
            help={PROPERTY_HELP.wrap}
            checked={Boolean(props.wrap)}
            onChange={(value) => set("wrap", value)}
          />
        )}
        {!props.isPage && !zone && paper?.multiPage && (
          <SwitchField
            label="No partir entre páginas"
            help={PROPERTY_HELP.keepTogether}
            checked={Boolean(props.keepTogether)}
            onChange={(value) => set("keepTogether", value)}
          />
        )}
        {!props.isPage && (
          <SwitchField
            label="Recortar contenido"
            help={PROPERTY_HELP.clip}
            checked={props.clipContent}
            onChange={(value) => set("clipContent", value)}
          />
        )}
        {!props.isPage && !props.locked && !zone && (
          <HideRuleFields props={props} set={set} />
        )}
        {props.isPage && paper?.multiPage && (
          <PageZoneFields props={props} set={set} />
        )}
      </PropertySection>

      {/* La zona va siempre a lo ancho de su página: sin posición ni tamaño. */}
      {!props.isPage && !props.locked && !zone && (
        <PositionSection props={props} set={set} />
      )}
      {!props.isPage && !zone && <SizeSection props={props} set={set} />}
      <SpacingSection
        props={props}
        set={set}
        showMargin={!props.isPage && !zone}
      />
      <AppearanceSection props={props} set={set} />
      <BorderSection props={props} set={set} />
    </div>
  );
}

PdfContainer.craft = {
  displayName: "Contenedor",
  props: DEFAULT_PROPS,
  rules: {
    canDrag: (node) =>
      !node.data.props.isPage &&
      !node.data.props.locked &&
      !node.data.props.pageZone &&
      !node.data.props.groupFooterPart,
    canMoveIn: (_incoming, self) => !self.data.props.locked,
    canMoveOut: (_outgoing, self) => !self.data.props.locked,
  },
  related: {
    settings: PdfContainerSettings,
  },
};
