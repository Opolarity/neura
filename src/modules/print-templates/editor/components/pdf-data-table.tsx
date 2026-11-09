import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  Element,
  NodeElement,
  useEditor,
  useNode,
  type NodeId,
  type UserComponent,
} from "@craftjs/core";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label";
import { useDragReorder } from "@/modules/ecommerce/editor/components/user-components/drag-reorder";
import {
  fieldOf,
  PRINT_DATA_SOURCES,
  type PrintDataField,
  type PrintDataSource,
  type PrintDataSourceId,
} from "../../constants/printDataSources";
import {
  cloneTree,
  DataRowContext,
  GROUP_FOOTER_ATTR,
  GROUP_NAME_KEY,
  GROUP_SOURCE,
  GROUP_VALUE_ATTR,
  GroupFooterContext,
  GROUP_HEADING_ATTR,
  GroupTitleContext,
  groupPushKey,
  sampleRowAt,
  TABLE_PARTS,
  tableRows,
  useDataSources,
  useDocumentSource,
} from "../lib/data-table";
import { usePaper } from "../lib/paper-context";
import { rowsOf, usePrintData } from "../lib/print-data";
import { usePagePush } from "../lib/pagination";
import { cloneForCopy } from "../lib/clone-copy";
import { formatFieldValue } from "../../constants/printDataSources";
import { PROPERTY_HELP } from "../lib/property-help";
import { useEditableNode } from "../lib/use-editable-node";
import { useNodeProps } from "../lib/use-node-props";
import { useParentDirection } from "../lib/use-parent-direction";
import { useFreeOrigin } from "../lib/use-free-origin";
import {
  DEFAULT_TABLE_LINES,
  TABLE_LINE_OPTIONS,
  type TableLinesProps,
} from "../lib/table-lines";
import { mm } from "../lib/units";
import { numberRule } from "../lib/validators";
import {
  BORDER_LINE_OPTIONS,
  appearanceStyle,
  borderStyle,
  DEFAULT_APPEARANCE,
  DEFAULT_BORDER,
  DEFAULT_POSITION,
  DEFAULT_SIZE,
  DEFAULT_SPACING,
  FONT_FAMILIES,
  positionStyle,
  sizeStyle,
  spacingStyle,
  type AppearanceProps,
  type BorderProps,
  type PositionProps,
  type SizeProps,
  type SpacingProps,
} from "../lib/style-props";
import { PdfContainer, type PdfContainerProps } from "./pdf-container";
import { TableLinesOverlay } from "./table-lines";
import { PdfText, type PdfTextProps } from "./pdf-text";
import { PdfImage } from "./pdf-image";
import { PropertySection } from "./property-section";
import {
  ColorPropertyField,
  NumberField,
  SelectField,
  SwitchField,
} from "./settings-fields";
import { EditorTooltip } from "./editor-tooltip";
import { CommitInput } from "./commit-input";
import { HelpLabel } from "./help-label";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";

/** Si el título se repite en cada página: no, igual o con un texto al final. */
export type TitleRepeat = "none" | "same" | "continued";

const TITLE_REPEAT_OPTIONS: readonly { value: TitleRepeat; label: string }[] = [
  { value: "none", label: "No" },
  { value: "same", label: "Igual" },
  { value: "continued", label: "Con un texto al final" },
];

/** El título: un Contenedor en fila, como el encabezado, sin línea. */
const TITLE_PROPS: Partial<PdfContainerProps> = {
  locked: true,
  direction: "row",
  heightMode: "hug",
  padding: { top: 0, right: 0, bottom: 1, left: 0 },
  background: "rgba(255, 255, 255, 0)",
};

/** «Ocultar columnas vacías»: no, en toda la Tabla o en cada grupo. */
export type EmptyColumns = "none" | "table" | "group";

const EMPTY_COLUMNS_OPTIONS: readonly { value: EmptyColumns; label: string }[] =
  [
    { value: "none", label: "No" },
    { value: "table", label: "En toda la tabla" },
    { value: "group", label: "En cada grupo" },
  ];

/** «Si no hay filas»: solo el encabezado, con un mensaje o sin la Tabla. */
export type EmptyRows = "header" | "message" | "hide";

const EMPTY_ROWS_OPTIONS: readonly { value: EmptyRows; label: string }[] = [
  { value: "header", label: "Mostrar solo el encabezado" },
  { value: "message", label: "Mostrar un mensaje" },
  { value: "hide", label: "Ocultar la tabla" },
];

/** Lo propio de la Tabla de datos. */
interface DataTableContentProps {
  /** De qué lista sale cada fila (constants/printDataSources). */
  source: PrintDataSourceId;
  /**
   * Un título arriba de la Tabla (un Contenedor con su Texto, que se
   * escribe) y si se repite donde la Tabla sigue en otra página: igual o con
   * «(continuación)», como las hojas de hoy.
   */
  showTitle: boolean;
  titleRepeat: TitleRepeat;
  /** Con «Con un texto al final»: lo que se agrega al título repetido. */
  titleRepeatText: string;
  /**
   * Agrupar por una columna (su campo): cada vez que cambia su valor, la
   * Tabla pone el título (con el nombre del grupo) y el encabezado otra vez,
   * como las secciones por clase del Requerimiento de hoy. Vacío = sin
   * grupos. El título de la Tabla dice el del primero.
   */
  groupBy: string;
  /**
   * Con grupos: un pie al terminar cada grupo, un Contenedor de la Tabla
   * («Pie de grupo») con sus Textos, que se edita como cualquiera y recibe
   * componentes; se repite en cada grupo con sus datos (origen «Grupo» de
   * sus Textos), como el subtotal de cada sección de las hojas de hoy.
   */
  showGroupFooter: boolean;
  /**
   * Solo para los diseños: con qué arranca el pie de grupo: su rótulo
   * (escrito o un dato), si lleva el nombre del grupo y el dato del total.
   */
  startGroupFooter?: {
    label?: string;
    labelKey?: string;
    name?: boolean;
    valueKey?: string;
  };
  /**
   * Las columnas sin ningún dato no salen: en ninguna fila de la Tabla
   * (`table`) o en las de cada grupo, con su encabezado (`group`). `true`, de
   * antes, es `table`.
   */
  hideEmptyColumns: EmptyColumns | boolean;
  showHeader: boolean;
  /**
   * Con encabezado y varias páginas: si se repite arriba de cada página en
   * la que sigue la Tabla (lib/pagination).
   */
  repeatHeader: boolean;
  /** Espacio entre el encabezado y las filas, y entre una fila y otra. */
  rowGapMm: number;
  /** Cuántos registros de ejemplo se dibujan en el editor (0: ninguno). */
  sampleRows: number;
  /**
   * Sin ninguna fila (en el editor, con 0 filas de ejemplo): el título y el
   * encabezado solos, con un mensaje debajo (`emptyRowsText`) o nada de la
   * Tabla (fuera de la edición, como «Ocultar si está vacío»).
   */
  emptyRows: EmptyRows;
  emptyRowsText: string;
  /** Colorear una fila sí y una no. */
  stripeRows: boolean;
  /** Cuáles: las impares (1.ª, 3.ª…) o las pares. */
  stripeOn: "odd" | "even";
  stripeColor: string;
  /**
   * Las filas una debajo de otra (una lista) o una al lado de otra, pasando
   * a otra fila si no entran (las fotos de la Orden de producción). Así, la
   * Tabla no se parte entre páginas.
   */
  rowsDirection?: "column" | "row";
  /**
   * Solo para los diseños de las plantillas del sistema (editor/designs): el
   * estilo con que arrancan el encabezado, la fila y sus Textos. Se usan al
   * crearse la Tabla; después cada parte se cambia como siempre.
   */
  startTitle?: Partial<PdfContainerProps>;
  /** El Texto del título con que arranca (su `text`, su letra). */
  startTitleText?: Partial<PdfTextProps>;
  startHeader?: Partial<PdfContainerProps>;
  startRow?: Partial<PdfContainerProps>;
  startHeaderCell?: Partial<PdfTextProps>;
  startCell?: Partial<PdfTextProps>;
}

export interface PdfDataTableProps
  extends
    DataTableContentProps,
    TableLinesProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {}

const DEFAULT_PROPS: PdfDataTableProps = {
  source: "invoice_items",
  showTitle: false,
  titleRepeat: "continued",
  titleRepeatText: "(continuación)",
  groupBy: "",
  showGroupFooter: false,
  hideEmptyColumns: false,
  showHeader: true,
  repeatHeader: true,
  rowGapMm: 0,
  stripeRows: false,
  stripeOn: "even",
  stripeColor: "rgba(240, 240, 240, 1)",
  sampleRows: 3,
  emptyRows: "header",
  emptyRowsText: "Sin registros",
  ...DEFAULT_TABLE_LINES,
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  // Ancha como su contenedor y alta como sus filas.
  heightMode: "hug",
  ...DEFAULT_SPACING,
  ...DEFAULT_APPEARANCE,
  ...DEFAULT_BORDER,
};

/** Blanco transparente: lo de dentro deja ver el fondo de la Tabla. */
const CLEAR = "rgba(255, 255, 255, 0)";

/** El encabezado y la fila: en fila, cada columna un Texto. */
const PART_PROPS: Partial<PdfContainerProps> = {
  locked: true,
  direction: "row",
  gapMm: 1,
  heightMode: "hug",
  padding: { top: 0.5, right: 0, bottom: 0.5, left: 0 },
  background: CLEAR,
};

const HEADER_PROPS: Partial<PdfContainerProps> = {
  ...PART_PROPS,
  // Una línea bajo el encabezado, como el ticket de hoy.
  padding: { top: 0.5, right: 0, bottom: 1, left: 0 },
  borderWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
};

/** Lo común de los Textos de una columna: el ancho es el de la columna. */
const cellProps = (field: PrintDataField): Partial<PdfTextProps> => ({
  locked: true,
  align: field.align,
  fontSizePt: 8,
  background: CLEAR,
  ...(field.widthMm
    ? { widthMode: "fixed", widthMm: field.widthMm }
    : { widthMode: "fill" }),
  ...(field.cut && field.widthMm && { overflowMode: "ellipsis" }),
});

const headerCell = (
  field: PrintDataField,
  start: Partial<PdfTextProps> = {},
): ReactElement => (
  <PdfText
    key={field.key}
    {...cellProps(field)}
    fontWeight={700}
    {...start}
    text={field.label}
  />
);

/** El gris de las columnas con tono (PrintDataField.tone). */
const TONE_GRAY = "rgba(110, 110, 110, 1)";

/** Cómo arranca una columna con tono: encima de todo lo demás. */
const toneProps = (field: PrintDataField): Partial<PdfTextProps> =>
  field.tone === "code"
    ? { fontSizePt: 7.5, color: TONE_GRAY }
    : field.tone === "muted"
      ? { color: TONE_GRAY }
      : {};

const rowCell = (
  field: PrintDataField,
  start: Partial<PdfTextProps> = {},
): ReactElement =>
  field.kind === "image" ? (
    // Una columna de imagen: una Imagen de su tamaño, con la de cada fila.
    <PdfImage
      key={field.key}
      locked
      field={field.key}
      widthMode="fixed"
      widthMm={field.widthMm ?? 24}
      heightMode="fixed"
      heightMm={field.heightMm ?? field.widthMm ?? 24}
      {...(start as object)}
    />
  ) : (
    <PdfText
      key={field.key}
      {...cellProps(field)}
      {...start}
      {...toneProps(field)}
      field={field.key}
    />
  );

const defaultFields = (source: PrintDataSource) =>
  source.defaultColumns
    .map((key) => fieldOf(source, key))
    .filter((field): field is PrintDataField => Boolean(field));

const FLEX_PASS_THROUGH: CSSProperties = { display: "contents" };

/** Hasta cuántas filas de ejemplo se dibujan en el editor. */
const MAX_SAMPLE_ROWS = 40;

const clampRows = (value: number) =>
  Math.min(MAX_SAMPLE_ROWS, Math.max(0, Math.round(value)));

/** El mensaje sin filas: la letra de las filas, en gris, como las hojas de hoy. */
const EMPTY_MESSAGE_STYLE: CSSProperties = {
  padding: `${mm(1)} ${mm(2)}`,
  fontFamily: FONT_FAMILIES.helvetica.css,
  fontSize: "8pt",
  color: TONE_GRAY,
};

/**
 * Repite una fila por cada registro de su fuente. En el editor no hay un
 * documento de verdad: dibuja tantas filas de ejemplo como diga «Filas de
 * ejemplo», con los registros de ejemplo de la fuente.
 *
 * El encabezado y la primera fila son Contenedores enlazados; las demás filas
 * son hijos de la Tabla, copias de la primera (lib/data-table). Todas se ven
 * en la Estructura y comparten el estilo.
 */
export const PdfDataTable: UserComponent<Partial<PdfDataTableProps>> = (
  props,
) => {
  const p = { ...DEFAULT_PROPS, ...props };
  // Con las columnas iniciales del documento abierto.
  const source = useDocumentSource(p.source);
  const { ref, outline, nodeProps } = useEditableNode();
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();
  const { id, rowId, extraRows } = useNode((node) => ({
    rowId: node.data.linkedNodes[TABLE_PARTS.row] as NodeId | undefined,
    extraRows: node.data.nodes,
  }));
  // Mientras se arrastra algo, lo de dentro no recibe el puntero: así se
  // suelta junto a la Tabla, no dentro (no acepta nada).
  const { actions, query, dragging, editing } = useEditor((state) => ({
    dragging: state.events.dragged.size > 0 || state.indicator !== null,
    editing: state.options.enabled,
  }));
  const passThrough: CSSProperties = {
    ...FLEX_PASS_THROUGH,
    ...(dragging && { pointerEvents: "none" }),
  };
  const fields = defaultFields(source);
  // Las filas del documento que se imprime (todas, sin tope); en el editor,
  // tantas de ejemplo como «Filas de ejemplo».
  const realRows = rowsOf(usePrintData(), source.id);
  const sampleRows = realRows ? realRows.length : clampRows(p.sampleRows);
  // Sin filas: la primera (el Contenedor enlazado, que siempre está) no se
  // ve, ni sus grupos, pies o columnas vacías.
  const noRows = sampleRows === 0;
  // El registro de cada fila (la primera y las demás), el mismo objeto
  // entre renders: así los Textos de las filas no se vuelven a dibujar cada
  // vez que se dibuja la Tabla.
  // Con filas coloreadas, cada fila sabe si le toca el color.
  const rowValues = useMemo(
    () =>
      Array.from({ length: extraRows.length + 1 }, (_, index) => ({
        source,
        row: realRows ? (realRows[index] ?? {}) : sampleRowAt(source, index),
        stripe:
          p.stripeRows && (index % 2 === 0) === (p.stripeOn === "odd")
            ? p.stripeColor
            : undefined,
      })),
    [
      source,
      realRows,
      extraRows.length,
      p.stripeRows,
      p.stripeOn,
      p.stripeColor,
    ],
  );

  // Una Tabla recién soltada trae el encabezado y la primera fila (los crea
  // craft al dibujarla): las demás filas se agregan aquí, como esos dos, fuera
  // del deshacer. Se cuentan en el estado, no en el render: así no se
  // agregan dos veces. Quitar filas lo hace el panel (Filas de ejemplo); al
  // imprimir, aquí: las de ejemplo que el documento no llena.
  useEffect(() => {
    if (!rowId) return;
    const extras = query.node(id).get().data.nodes;
    const wanted = Math.max(0, sampleRows - 1);
    for (let index = extras.length; index < wanted; index++) {
      actions.history.ignore().addNodeTree(cloneTree(query, rowId, id), id);
    }
    if (realRows)
      extras
        .slice(wanted)
        .forEach((extraId) => actions.history.ignore().delete(extraId));
  }, [actions, query, id, rowId, sampleRows, realRows]);

  // «Agrupar por»: el nombre del grupo de cada fila y dónde empieza uno.
  const groupField = p.groupBy ? fieldOf(source, p.groupBy) : undefined;
  const groupNames = rowValues.map((value) =>
    groupField ? formatFieldValue(groupField, value.row[groupField.key]) : "",
  );
  // El pie de cada grupo, al terminar (la última fila del grupo): el de
  // verdad en el primero y una copia, con sus datos, en los demás.
  const withFooter = Boolean(groupField) && p.showGroupFooter;
  const lastOfGroup = (index: number) =>
    index === rowValues.length - 1 ||
    groupNames[index + 1] !== groupNames[index];
  const firstLast = rowValues.findIndex((_, index) => lastOfGroup(index));
  /** Los datos de un grupo, por clave, como los escribe su pie. */
  const groupValues = (index: number): Record<string, string> => ({
    [GROUP_NAME_KEY]: groupNames[index],
    ...Object.fromEntries(
      source.fields.map((field) => [
        field.key,
        formatFieldValue(field, rowValues[index].row[field.key]),
      ]),
    ),
  });
  const footerOf = (index: number) => {
    if (!withFooter || noRows || !lastOfGroup(index)) return null;
    if (index === firstLast)
      return (
        <div {...{ [GROUP_FOOTER_ATTR]: "" }}>
          <GroupFooterContext.Provider
            value={{
              name: groupNames[index],
              row: rowValues[index].row,
              source,
            }}
          >
            <Element
              id={TABLE_PARTS.groupFooter}
              is={PdfContainer}
              canvas
              {...GROUP_FOOTER_PROPS}
            >
              {groupFooterStart(p.startGroupFooter)}
            </Element>
          </GroupFooterContext.Provider>
        </div>
      );
    return <GroupFooterCopy tableId={id} values={groupValues(index)} />;
  };
  const groupStarts = groupNames.map(
    (name, index) =>
      Boolean(groupField) && index > 0 && name !== groupNames[index - 1],
  );
  // «Ocultar columnas vacías»: las columnas (por su orden) sin ningún dato.
  const { columnFields } = useEditor((state) => ({
    columnFields: rowId
      ? (state.nodes[rowId]?.data.nodes ?? []).map(
          (cellId) => (state.nodes[cellId]?.data.props.field as string) ?? "",
        )
      : [],
  }));
  const emptyMode: EmptyColumns =
    p.hideEmptyColumns === true
      ? "table"
      : p.hideEmptyColumns === "group" && !groupField
        ? "table"
        : p.hideEmptyColumns || "none";
  // Las columnas (desde 1) sin ningún dato en esas filas.
  const emptyIn = (rows: number[]) =>
    columnFields.flatMap((key, index) =>
      key &&
      rows.every((row) => {
        const cell = rowValues[row]?.row[key];
        return (
          cell === null || cell === undefined || String(cell).trim() === ""
        );
      })
        ? [index + 1]
        : [],
    );
  // El grupo de cada fila (0, 1, 2…) y las columnas que oculta cada grupo.
  const groupOf: number[] = [];
  groupNames.forEach((_, index) =>
    groupOf.push(
      index === 0 ? 0 : groupOf[index - 1] + (groupStarts[index] ? 1 : 0),
    ),
  );
  const groupRows = new Map<number, number[]>();
  groupOf.forEach((group, row) =>
    groupRows.set(group, [...(groupRows.get(group) ?? []), row]),
  );
  const groupHidden = new Map<number, number[]>(
    emptyMode === "group"
      ? [...groupRows].map(([group, rows]) => [group, emptyIn(rows)])
      : [],
  );
  const emptyColumns =
    emptyMode === "table" ? emptyIn(rowValues.map((_, row) => row)) : [];
  // Las reglas que las ocultan: en toda la Tabla o en las filas de cada grupo
  // (el encabezado, en las del primero).
  const emptyRules = noRows
    ? []
    : emptyMode === "table"
      ? emptyColumns.map(
          (column) =>
            `[${TABLE_ID_ATTR}="${id}"] > .${TABLE_PART_CLASS} > :not([${GROUP_FOOTER_ATTR}]) > :nth-child(${column}) { display: none !important; }`,
        )
      : [...groupHidden].flatMap(([group, columns]) =>
          columns.map(
            (column) =>
              `[${TABLE_ID_ATTR}="${id}"] > .${TABLE_PART_CLASS}[${GROUP_INDEX_ATTR}="${group}"] > :not([${GROUP_FOOTER_ATTR}]) > :nth-child(${column}) { display: none !important; }`,
          ),
        );
  // Lo que marca cada envoltorio: su grupo y, por grupo, lo que oculta.
  const groupAttrs = (row: number) => ({
    [GROUP_NAME_ATTR]: groupNames[row],
    [GROUP_INDEX_ATTR]: String(groupOf[row] ?? 0),
    ...(emptyMode === "group" && {
      [GROUP_HIDDEN_ATTR]: (groupHidden.get(groupOf[row] ?? 0) ?? []).join(","),
    }),
  });

  const style: CSSProperties = {
    display: "flex",
    flexDirection: p.rowsDirection === "row" ? "row" : "column",
    ...(p.rowsDirection === "row" && { flexWrap: "wrap" }),
    gap: mm(p.rowGapMm),
    boxSizing: "border-box",
    minWidth: 0,
    ...sizeStyle(p, parentDirection, p.positionFree),
    ...spacingStyle(p),
    ...positionStyle(p, freeOrigin),
    // Las líneas se colocan dentro de la Tabla. Libre ya es absolute.
    ...(!p.positionFree && { position: "relative" }),
    ...appearanceStyle(p),
    ...borderStyle(p),
    ...outline,
    // «Ocultar la tabla» sin filas: mientras se edita sigue a la vista.
    ...(noRows && p.emptyRows === "hide" && !editing && { display: "none" }),
  };

  return (
    <div ref={ref} style={style} {...nodeProps} {...{ [TABLE_ID_ATTR]: id }}>
      {/* Las columnas vacías, ocultas en el encabezado y en cada fila. */}
      {emptyRules.length > 0 && <style>{emptyRules.join("\n")}</style>}
      <TableLinesOverlay
        tableId={id}
        lines={p.lines}
        lineStyle={p.lineStyle}
        lineColor={p.lineColor}
        lineWidthMm={p.lineWidthMm}
      />
      {/* El título, solo si se muestra: así una Tabla sin título no lo crea
          (ni sale en la Estructura). */}
      {p.showTitle && (
        <div style={passThrough}>
          <GroupTitleContext.Provider
            value={groupField && !noRows ? groupNames[0] : null}
          >
            <Element
              id={TABLE_PARTS.title}
              is={PdfContainer}
              canvas
              {...TITLE_PROPS}
              {...p.startTitle}
            >
              <PdfText
                locked
                text="Título"
                fontSizePt={9}
                fontWeight={700}
                background="rgba(255, 255, 255, 0)"
                {...p.startTitleText}
              />
            </Element>
          </GroupTitleContext.Provider>
        </div>
      )}
      {/* Oculto (Mostrar encabezado) craft ya no lo dibuja; el envoltorio
          también lo esconde por si el nodo no quedó marcado. */}
      <div
        className={TABLE_PART_CLASS}
        style={{ ...passThrough, ...(!p.showHeader && { display: "none" }) }}
        {...{ [GROUP_INDEX_ATTR]: "0" }}
      >
        <Element
          id={TABLE_PARTS.header}
          is={PdfContainer}
          canvas
          {...HEADER_PROPS}
          {...p.startHeader}
        >
          {fields.map((field) => headerCell(field, p.startHeaderCell))}
        </Element>
      </div>
      <DataRowContext.Provider value={rowValues[0]}>
        <div
          className={TABLE_PART_CLASS}
          style={{ ...passThrough, ...(noRows && { display: "none" }) }}
          {...groupAttrs(0)}
        >
          <Element
            id={TABLE_PARTS.row}
            is={PdfContainer}
            canvas
            {...PART_PROPS}
            {...p.startRow}
          >
            {fields.map((field) => rowCell(field, p.startCell))}
          </Element>
          {footerOf(0)}
        </div>
      </DataRowContext.Provider>
      {noRows && p.emptyRows === "message" && (
        <div style={EMPTY_MESSAGE_STYLE}>{p.emptyRowsText}</div>
      )}
      {extraRows.map((extraId, index) => (
        <DataRowContext.Provider key={extraId} value={rowValues[index + 1]}>
          {/* Donde empieza otro grupo: su título y el encabezado. */}
          {groupStarts[index + 1] && (
            <GroupHeading
              tableId={id}
              rowId={extraId}
              name={groupNames[index + 1]}
              hiddenColumns={
                emptyMode === "group"
                  ? (groupHidden.get(groupOf[index + 1]) ?? [])
                  : undefined
              }
            />
          )}
          <div
            className={TABLE_PART_CLASS}
            style={passThrough}
            {...groupAttrs(index + 1)}
          >
            <NodeElement id={extraId} />
            {footerOf(index + 1)}
          </div>
        </DataRowContext.Provider>
      ))}
    </div>
  );
};

/** Marca la Tabla, para la regla que oculta sus columnas vacías. */
const TABLE_ID_ATTR = "data-table-id";

/** El envoltorio del encabezado y de cada fila (no del título). */
const TABLE_PART_CLASS = "pdf-table-part";

/** El grupo de cada fila (lib/pagination lo lee para su título repetido). */
export const GROUP_NAME_ATTR = "data-table-group-name";

/** El grupo (0, 1, 2…) de cada fila y del encabezado (el del primero). */
const GROUP_INDEX_ATTR = "data-table-group-index";

/** Con columnas vacías por grupo: las que oculta el grupo de cada fila. */
const GROUP_HIDDEN_ATTR = "data-table-group-hidden";

/** El espacio arriba del título de un grupo que no es el primero, en mm. */
const GROUP_GAP_MM = 4;

/**
 * El título de un grupo que no es el primero y, debajo, el encabezado: una
 * copia de los de la Tabla (no nodos: no se seleccionan), con el nombre del
 * grupo. Se rehace cuando cambian los originales; al saltar de página, baja
 * con su primera fila (groupPushKey).
 */
function GroupHeading({
  tableId,
  rowId,
  name,
  hiddenColumns,
}: {
  tableId: NodeId;
  rowId: NodeId;
  name: string;
  /** Con columnas vacías por grupo: las que oculta este. */
  hiddenColumns?: number[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const push = usePagePush(groupPushKey(rowId));
  const { titleDom, headerDom } = useEditor((state) => {
    const table = state.nodes[tableId];
    const titleId = table?.data.linkedNodes[TABLE_PARTS.title];
    const headerId = table?.data.linkedNodes[TABLE_PARTS.header];
    const visible = (partId: NodeId | undefined) =>
      partId && !state.nodes[partId]?.data.hidden
        ? (state.nodes[partId]?.dom ?? null)
        : null;
    return {
      titleDom: table?.data.props.showTitle ? visible(titleId) : null,
      headerDom: table?.data.props.showHeader ? visible(headerId) : null,
    };
  });

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const render = () => {
      const parts: HTMLElement[] = [];
      if (titleDom) {
        const title = cloneForCopy(titleDom, { text: name });
        title.style.marginTop = "0";
        parts.push(title);
      }
      if (headerDom) parts.push(cloneForCopy(headerDom, { hiddenColumns }));
      target.replaceChildren(...parts);
    };
    render();
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };
    const observers = [titleDom, headerDom]
      .filter((dom): dom is HTMLElement => Boolean(dom))
      .flatMap((dom) => {
        const resize = new ResizeObserver(schedule);
        resize.observe(dom);
        const mutation = new MutationObserver(schedule);
        mutation.observe(dom, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["style"],
        });
        return [resize, mutation];
      });
    return () => {
      cancelAnimationFrame(frame);
      observers.forEach((observer) => observer.disconnect());
    };
    // Las columnas ocultas, como texto: el arreglo cambia en cada dibujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleDom, headerDom, name, hiddenColumns?.join(",")]);

  return (
    <div
      ref={ref}
      aria-hidden
      {...{ [GROUP_HEADING_ATTR]: rowId }}
      className="pointer-events-none"
      style={{ marginTop: `calc(${GROUP_GAP_MM}mm + ${push}px)` }}
    />
  );
}

/** El pie de grupo: en fila, a la derecha, como el subtotal de hoy. */
const GROUP_FOOTER_PROPS: Partial<PdfContainerProps> = {
  groupFooterPart: true,
  direction: "row",
  alignX: "end",
  alignY: "center",
  gapMm: 2,
  heightMode: "hug",
  padding: { top: 1, right: 0, bottom: 2, left: 0 },
  background: "rgba(255, 255, 255, 0)",
};

/** La letra del pie con que arranca: la del subtotal de las hojas de hoy. */
const FOOTER_TEXT: Partial<PdfTextProps> = {
  fontSizePt: 7.5,
  fontWeight: 700,
  background: "rgba(255, 255, 255, 0)",
};
const FOOTER_SOFT = "rgba(110, 110, 110, 1)";

/**
 * Lo que lleva un pie de grupo nuevo: el rótulo (escrito o un dato), el
 * nombre del grupo y el total (34 mm, a la derecha). Sin nada dicho, el
 * rótulo «SUBTOTAL» y el nombre del grupo.
 */
function groupFooterStart(
  start: PdfDataTableProps["startGroupFooter"],
): ReactElement[] {
  const seed = start ?? { label: "SUBTOTAL", name: true };
  const parts: ReactElement[] = [];
  if (seed.labelKey)
    parts.push(
      <PdfText
        key="label"
        {...FOOTER_TEXT}
        color={FOOTER_SOFT}
        textCase="upper"
        valueSource={GROUP_SOURCE}
        valueKey={seed.labelKey}
      />,
    );
  else if (seed.label)
    parts.push(
      <PdfText
        key="label"
        {...FOOTER_TEXT}
        color={FOOTER_SOFT}
        textCase="upper"
        text={seed.label}
      />,
    );
  if (seed.name)
    parts.push(
      <PdfText
        key="name"
        {...FOOTER_TEXT}
        color={FOOTER_SOFT}
        textCase="upper"
        valueSource={GROUP_SOURCE}
        valueKey={GROUP_NAME_KEY}
      />,
    );
  if (seed.valueKey)
    parts.push(
      <PdfText
        key="value"
        {...FOOTER_TEXT}
        color="rgba(30, 30, 30, 1)"
        align="right"
        widthMode="fixed"
        widthMm={34}
        valueSource={GROUP_SOURCE}
        valueKey={seed.valueKey}
      />,
    );
  return parts;
}

/**
 * El pie de un grupo que no es el primero: una copia del de verdad (no un
 * nodo: no se selecciona) con los datos de este grupo en sus Textos de
 * origen «Grupo». Si todos esos datos están vacíos (un grupo sin total), no
 * sale. Va con la última fila del grupo.
 */
function GroupFooterCopy({
  tableId,
  values,
}: {
  tableId: NodeId;
  values: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { footerDom } = useEditor((state) => {
    const footerId =
      state.nodes[tableId]?.data.linkedNodes[TABLE_PARTS.groupFooter];
    return {
      footerDom:
        footerId && !state.nodes[footerId]?.data.hidden
          ? (state.nodes[footerId]?.dom ?? null)
          : null,
    };
  });
  const key = JSON.stringify(values);

  useEffect(() => {
    const target = ref.current;
    if (!target || !footerDom) return;
    const render = () => {
      const clone = cloneForCopy(footerDom);
      const bound = Array.from(
        clone.querySelectorAll<HTMLElement>(`[${GROUP_VALUE_ATTR}]`),
      );
      bound.forEach((element) => {
        element.textContent =
          values[element.getAttribute(GROUP_VALUE_ATTR) ?? ""] ?? "";
      });
      const empty =
        bound.length > 0 &&
        bound.every((element) => !element.textContent?.trim());
      target.replaceChildren(...(empty ? [] : [clone]));
    };
    render();
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(footerDom);
    const mutation = new MutationObserver(schedule);
    mutation.observe(footerDom, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
    };
    // Los datos, como texto: el objeto cambia en cada dibujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerDom, key]);

  return (
    <div
      ref={ref}
      aria-hidden
      {...{ [GROUP_FOOTER_ATTR]: "" }}
      className="pointer-events-none"
    />
  );
}

/** Cada cuánto (ms) cuenta como un solo paso de deshacer lo que se encadena. */
const BATCH_MS = 100;

/**
 * Cambiar las columnas o las filas toca varios nodos (el encabezado y cada
 * fila): se deshace de una vez. El primer cambio abre el paso de deshacer y
 * los siguientes se le suman.
 */
function useBatchedActions() {
  const { actions } = useEditor();
  return () => {
    let first = true;
    return () => {
      if (!first) return actions.history.throttle(BATCH_MS);
      first = false;
      return actions;
    };
  };
}

const validateGap = numberRule({ min: 0, empty: 0 });

/** En «Agrupar por», sin grupos (el Select no admite un valor vacío). */
const NO_GROUP = "none";

/** Cualquier texto vale; vacío, el título se repite igual. */
const validateRepeatText = (text: string) => ({ value: text });

const ROWS_DIRECTION_OPTIONS = [
  { value: "column", label: "Una debajo de otra" },
  { value: "row", label: "Una al lado de otra" },
] as const;

const validateLineWidth = numberRule({ positive: true });

const STRIPE_OPTIONS: { value: "odd" | "even"; label: string }[] = [
  { value: "odd", label: "Filas impares" },
  { value: "even", label: "Filas pares" },
];

const validateSampleRows = numberRule({
  min: 0,
  max: MAX_SAMPLE_ROWS,
  integer: true,
});

/** El encabezado y las filas de la Tabla, con los Textos de cada uno. */
function useTableParts(id: NodeId) {
  return useEditor((state) => {
    const headerId = state.nodes[id]?.data.linkedNodes[TABLE_PARTS.header] as
      NodeId | undefined;
    const rowIds = tableRows(state.nodes, id);
    const cellsOf = (partId: NodeId) => state.nodes[partId]?.data.nodes ?? [];
    const rowCells = rowIds[0] ? cellsOf(rowIds[0]) : [];
    return {
      headerId,
      rowIds,
      headerCells: headerId ? cellsOf(headerId) : [],
      rowCells,
      // Las columnas: los campos de la primera fila (todas son iguales).
      rowFields: rowCells.map(
        (cellId) => (state.nodes[cellId]?.data.props.field as string) ?? "",
      ),
    };
  });
}

function ColumnsField({ source }: { source: PrintDataSource }) {
  const { id } = useNode();
  const { query, headerId, rowIds, rowCells, rowFields } = useTableParts(id);
  const batch = useBatchedActions();

  const tree = (element: ReactElement) =>
    query.parseReactElement(element).toNodeTree();

  // Cada parte (encabezado y filas) con lo que se pone en ella por campo.
  const parts = [
    ...(headerId ? [{ partId: headerId, cell: headerCell }] : []),
    ...rowIds.map((partId) => ({ partId, cell: rowCell })),
  ];
  const cellsOf = (partId: NodeId) => query.node(partId).get().data.nodes;

  const add = (key: string) => {
    const field = fieldOf(source, key);
    if (!field) return;
    const step = batch();
    for (const { partId, cell } of parts) {
      step().addNodeTree(tree(cell(field)), partId, cellsOf(partId).length);
    }
  };

  const remove = (index: number) => {
    const step = batch();
    for (const { partId } of parts) {
      const cellId = cellsOf(partId)[index];
      if (cellId) step().delete(cellId);
    }
  };

  // Los Textos de dentro no se mueven (craft no deja: están bloqueados): se
  // reparte lo que tienen, que es todo lo que los distingue, en el orden nuevo.
  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || from === to) return;
    const step = batch();
    for (const { partId } of parts) {
      const cells = cellsOf(partId);
      const ordered = cells.map((cellId) =>
        structuredClone(query.node(cellId).get().data.props),
      );
      const [moved] = ordered.splice(from, 1);
      ordered.splice(to, 0, moved);
      cells.forEach((cellId, index) => {
        if (index < Math.min(from, to) || index > Math.max(from, to)) return;
        step().setProp(cellId, (draft: Record<string, unknown>) => {
          for (const key of Object.keys(draft)) delete draft[key];
          Object.assign(draft, ordered[index]);
        });
      });
    }
  };

  // Las columnas se reordenan arrastrándolas, como las listas del editor de
  // la tienda.
  const {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    itemDragClass,
  } = useDragReorder((fromId, toId) =>
    move(rowCells.indexOf(fromId), rowCells.indexOf(toId)),
  );

  if (!headerId || !rowIds.length) return null;

  const available = source.fields.filter(
    (field) => !rowFields.includes(field.key),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel help={PROPERTY_HELP.columns}>Columnas</FieldLabel>
      <div className="flex flex-col gap-1">
        {rowFields.map((key, index) => {
          const cellId = rowCells[index];
          return (
            <div
              key={cellId}
              className={`flex h-8 items-stretch rounded-md border border-border text-[12px] ${itemDragClass(cellId)}`}
              onDragOver={(e) => handleDragOver(e, cellId)}
              onDrop={(e) => handleDrop(e, cellId)}
            >
              <span
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(e, cellId);
                }}
                onDragEnd={handleDragEnd}
                className="flex shrink-0 items-center px-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-3 w-3" />
              </span>
              <span className="flex min-w-0 flex-1 items-center">
                <span className="truncate">
                  {fieldOf(source, key)?.label ?? key}
                </span>
              </span>
              <span className="flex items-center pr-1">
                <ColumnButton
                  label="Quitar"
                  // Siempre queda una: sin columnas la fila no se vería.
                  disabled={rowFields.length === 1}
                  onClick={() => remove(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </ColumnButton>
              </span>
            </div>
          );
        })}
      </div>
      {available.length > 0 && (
        // Sin valor: cada elección agrega una columna y vuelve a quedar vacío.
        <Select value="" onValueChange={add}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Agregar columna" />
          </SelectTrigger>
          <SelectContent>
            {available.map((field) => (
              <SelectItem
                key={field.key}
                value={field.key}
                className="text-[12px]"
              >
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function ColumnButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactElement;
}) {
  return (
    <EditorTooltip label={label} disabled={disabled}>
      <Button
        type="button"
        variant="ghost"
        className="h-6 w-6 shrink-0 p-0"
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
      >
        {children}
      </Button>
    </EditorTooltip>
  );
}

function PdfDataTableSettings() {
  // «Repetir en cada página» solo importa con varias páginas.
  const paper = usePaper();
  const { props, set } = useNodeProps<PdfDataTableProps>(DEFAULT_PROPS);
  const { id } = useNode();
  const { query } = useEditor();
  // El fondo del encabezado y el de la primera fila (las demás son copias).
  const colors = useEditor((state) => {
    const table = state.nodes[id];
    const headerId = table?.data.linkedNodes[TABLE_PARTS.header] ?? "";
    const rowId = table?.data.linkedNodes[TABLE_PARTS.row] ?? "";
    return {
      headerId,
      header: String(state.nodes[headerId]?.data.props.background ?? CLEAR),
      rows: String(state.nodes[rowId]?.data.props.background ?? CLEAR),
    };
  });
  const paintParts = (ids: string[], value: string) => {
    const step = batch();
    ids.filter(Boolean).forEach((partId) =>
      step().setProp(partId, (draft: PdfContainerProps) => {
        draft.background = value;
      }),
    );
  };
  const batch = useBatchedActions();
  const documentSources = useDataSources();
  const source = useDocumentSource(props.source);
  // La de la Tabla aunque su documento ya no la ofrezca: que se vea cuál es.
  const sources = documentSources.some((item) => item.id === source.id)
    ? documentSources
    : [source, ...documentSources];

  // Otra fuente, otros campos: las columnas vuelven a las de esa fuente, en
  // el encabezado y en cada fila.
  const changeSource = (next: PrintDataSourceId) => {
    if (next === props.source) return;
    // Con el tipo: mientras haya una sola fuente, TS da `next` por imposible.
    const nextSource: PrintDataSource =
      documentSources.find((item) => item.id === next) ??
      PRINT_DATA_SOURCES[next];
    const nodes = query.getNodes();
    const headerId = nodes[id].data.linkedNodes[TABLE_PARTS.header];
    const step = batch();
    step().setProp(id, (draft: PdfDataTableProps) => {
      draft.source = next;
    });
    const parts = [
      { partId: headerId, cell: headerCell },
      ...tableRows(nodes, id).map((partId) => ({ partId, cell: rowCell })),
    ];
    for (const { partId, cell } of parts) {
      if (!partId) continue;
      for (const cellId of query.node(partId).get().data.nodes)
        step().delete(cellId);
      defaultFields(nextSource).forEach((field, index) =>
        step().addNodeTree(
          query.parseReactElement(cell(field)).toNodeTree(),
          partId,
          index,
        ),
      );
    }
  };

  // Sin encabezado, el nodo queda oculto (craft no lo dibuja y la Estructura
  // no lo muestra), con su estilo, para volver igual. En un paso de deshacer.
  // Sin pie de grupo, el suyo queda oculto (con lo que lleva).
  const toggleGroupFooter = (value: boolean) => {
    const footerId = query.node(id).get().data.linkedNodes[
      TABLE_PARTS.groupFooter
    ];
    const step = batch();
    step().setProp(id, (draft: PdfDataTableProps) => {
      draft.showGroupFooter = value;
    });
    if (footerId) step().setHidden(footerId, !value);
  };

  // Sin título, el suyo queda oculto (con lo escrito), para volver igual.
  const toggleTitle = (value: boolean) => {
    const titleId = query.node(id).get().data.linkedNodes[TABLE_PARTS.title];
    const step = batch();
    step().setProp(id, (draft: PdfDataTableProps) => {
      draft.showTitle = value;
    });
    if (titleId) step().setHidden(titleId, !value);
  };

  const toggleHeader = (value: boolean) => {
    const headerId = query.node(id).get().data.linkedNodes[TABLE_PARTS.header];
    const step = batch();
    step().setProp(id, (draft: PdfDataTableProps) => {
      draft.showHeader = value;
    });
    if (headerId) step().setHidden(headerId, !value);
  };

  // Una fila por registro de ejemplo: las que sobran se quitan y las que
  // faltan se copian de la primera, en el mismo paso de deshacer.
  const changeSampleRows = (value: number) => {
    const next = clampRows(value);
    const [firstRow, ...extras] = tableRows(query.getNodes(), id);
    const step = batch();
    step().setProp(id, (draft: PdfDataTableProps) => {
      draft.sampleRows = next;
    });
    if (!firstRow) return;
    extras
      .slice(Math.max(0, next - 1))
      .forEach((rowId) => step().delete(rowId));
    for (let index = extras.length; index < next - 1; index++) {
      step().addNodeTree(cloneTree(query, firstRow, id), id);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Lo propio del componente: sin nombre, se sobreentiende. */}
      <PropertySection>
        <SelectField
          label="Fuente"
          help={PROPERTY_HELP.dataSource}
          value={source.id}
          options={sources.map((item) => ({
            value: item.id,
            label: item.label,
          }))}
          onChange={changeSource}
        />
        <ColumnsField source={source} />
        <SelectField
          label="Agrupar por"
          help={PROPERTY_HELP.groupBy}
          value={props.groupBy || NO_GROUP}
          options={[
            { value: NO_GROUP, label: "Sin grupos" },
            ...source.fields.map((field) => ({
              value: field.key,
              label: field.label,
            })),
          ]}
          onChange={(value) => {
            set("groupBy", value === NO_GROUP ? "" : value);
            // El título hace de título de cada grupo.
            if (value !== NO_GROUP && !props.showTitle) toggleTitle(true);
          }}
        />
        {props.groupBy && (
          <SwitchField
            label="Pie de cada grupo"
            help={PROPERTY_HELP.groupFooter}
            checked={props.showGroupFooter}
            onChange={toggleGroupFooter}
          />
        )}
        <SelectField
          label="Ocultar columnas vacías"
          help={PROPERTY_HELP.hideEmptyColumns}
          value={
            props.hideEmptyColumns === true
              ? "table"
              : props.hideEmptyColumns || "none"
          }
          options={
            props.groupBy
              ? EMPTY_COLUMNS_OPTIONS
              : EMPTY_COLUMNS_OPTIONS.filter(
                  (option) => option.value !== "group",
                )
          }
          onChange={(value) => set("hideEmptyColumns", value)}
        />
        <SwitchField
          label="Mostrar título"
          help={PROPERTY_HELP.showTitle}
          checked={props.showTitle}
          onChange={toggleTitle}
        />
        {props.showTitle && paper?.multiPage && (
          <SelectField
            label="Repetir el título"
            help={PROPERTY_HELP.titleRepeat}
            value={props.titleRepeat}
            options={TITLE_REPEAT_OPTIONS}
            onChange={(value) => set("titleRepeat", value)}
          />
        )}
        {props.showTitle &&
          paper?.multiPage &&
          props.titleRepeat === "continued" && (
            <PanelField
              label={
                <HelpLabel
                  label="Texto al final"
                  help={PROPERTY_HELP.titleRepeatText}
                />
              }
            >
              {(fieldId) => (
                <CommitInput
                  id={fieldId}
                  value={props.titleRepeatText}
                  validate={validateRepeatText}
                  onCommit={(value) => set("titleRepeatText", value)}
                  placeholder="(continuación)"
                  className="h-8 text-[12px] md:text-[12px]"
                />
              )}
            </PanelField>
          )}
        <SwitchField
          label="Mostrar encabezado"
          help={PROPERTY_HELP.showHeader}
          checked={props.showHeader}
          onChange={toggleHeader}
        />
        {props.showHeader && paper?.multiPage && (
          <SwitchField
            label="Repetir en cada página"
            help={PROPERTY_HELP.repeatHeader}
            checked={props.repeatHeader}
            onChange={(value) => set("repeatHeader", value)}
          />
        )}
        <SelectField
          label="Filas"
          help={PROPERTY_HELP.rowsDirection}
          value={props.rowsDirection ?? "column"}
          options={ROWS_DIRECTION_OPTIONS}
          onChange={(value) => set("rowsDirection", value)}
        />
        <NumberField
          label="Separación entre filas"
          help={PROPERTY_HELP.rowGap}
          value={props.rowGapMm}
          validate={validateGap}
          onChange={(value) => set("rowGapMm", value)}
        />
        {/* El fondo del encabezado y de las filas: el de sus Contenedores. */}
        {props.showHeader && (
          <ColorPropertyField
            label="Fondo del encabezado"
            help={PROPERTY_HELP.headerBackground}
            value={colors.header}
            onChange={(value) => paintParts([colors.headerId], value)}
          />
        )}
        <ColorPropertyField
          label="Fondo de las filas"
          help={PROPERTY_HELP.rowsBackground}
          value={colors.rows}
          onChange={(value) =>
            paintParts(tableRows(query.getNodes(), id), value)
          }
        />
        <SwitchField
          label="Filas coloreadas"
          help={PROPERTY_HELP.stripeRows}
          checked={props.stripeRows}
          onChange={(value) => set("stripeRows", value)}
        />
        {props.stripeRows && (
          <>
            <SelectField
              label="Colorear"
              help={PROPERTY_HELP.stripeOn}
              value={props.stripeOn}
              options={STRIPE_OPTIONS}
              onChange={(value) => set("stripeOn", value)}
            />
            <ColorPropertyField
              label="Color de las filas"
              help={PROPERTY_HELP.stripeColor}
              value={props.stripeColor}
              onChange={(value) => set("stripeColor", value)}
            />
          </>
        )}
        <NumberField
          label="Filas de ejemplo"
          help={PROPERTY_HELP.sampleRows}
          unit=""
          value={props.sampleRows}
          validate={validateSampleRows}
          onChange={changeSampleRows}
        />
        <SelectField
          label="Si no hay filas"
          help={PROPERTY_HELP.emptyRows}
          value={props.emptyRows}
          options={EMPTY_ROWS_OPTIONS}
          onChange={(value) => set("emptyRows", value)}
        />
        {props.emptyRows === "message" && (
          <PanelField
            label={
              <HelpLabel label="Mensaje" help={PROPERTY_HELP.emptyRowsText} />
            }
          >
            {(fieldId) => (
              <CommitInput
                id={fieldId}
                value={props.emptyRowsText}
                validate={validateRepeatText}
                onCommit={(value) => set("emptyRowsText", value)}
                placeholder="Sin registros"
                className="h-8 text-[12px] md:text-[12px]"
              />
            )}
          </PanelField>
        )}
        <SelectField
          label="Líneas"
          help={PROPERTY_HELP.tableLines}
          value={props.lines}
          options={TABLE_LINE_OPTIONS}
          onChange={(value) => set("lines", value)}
        />
        {props.lines !== "none" && (
          <>
            <SelectField
              label="Tipo de línea"
              help={PROPERTY_HELP.tableLineStyle}
              value={props.lineStyle}
              options={BORDER_LINE_OPTIONS}
              onChange={(value) => set("lineStyle", value)}
            />
            <NumberField
              label="Grosor de línea"
              help={PROPERTY_HELP.tableLineWidth}
              value={props.lineWidthMm}
              validate={validateLineWidth}
              onChange={(value) => set("lineWidthMm", value)}
            />
            <ColorPropertyField
              label="Color de línea"
              help={PROPERTY_HELP.tableLineColor}
              value={props.lineColor}
              onChange={(value) => set("lineColor", value)}
            />
          </>
        )}
      </PropertySection>
      <PositionSection props={props} set={set} />
      <SizeSection props={props} set={set} />
      <SpacingSection props={props} set={set} />
      <AppearanceSection props={props} set={set} />
      <BorderSection props={props} set={set} />
    </div>
  );
}

PdfDataTable.craft = {
  displayName: "Tabla de datos",
  props: DEFAULT_PROPS,
  related: {
    settings: PdfDataTableSettings,
  },
};
