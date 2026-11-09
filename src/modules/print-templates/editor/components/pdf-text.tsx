import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useEditor, useNode, type UserComponent } from "@craftjs/core";
import { Textarea } from "@/components/ui/textarea";
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field";
import {
  fieldOf,
  formatFieldValue,
  PRINT_DATA_SOURCES,
  type PrintDataSourceId,
} from "../../constants/printDataSources";
import {
  GROUP_NAME_KEY,
  GROUP_SOURCE,
  GROUP_VALUE_ATTR,
  GroupFooterContext,
  GroupTitleContext,
  groupFooterSourceOf,
  tableSourceOf,
  useDataRow,
  useDataSources,
} from "../lib/data-table";
import {
  CONTEXT_SOURCES,
  isContextSource,
  useContextValues,
  type ContextSourceId,
} from "../lib/context-values";
import { useEditableNode } from "../lib/use-editable-node";
import {
  TEXT_GAP_ATTR,
  useTextSplits,
  type TextSplit,
} from "../lib/pagination";
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
  DEFAULT_TYPOGRAPHY,
  positionStyle,
  sizeStyle,
  spacingStyle,
  typographyStyle,
  type AppearanceProps,
  type BorderProps,
  type PositionProps,
  type SizeProps,
  type SpacingProps,
  type TypographyProps,
} from "../lib/style-props";
import { PropertySection } from "./property-section";
import { SelectField } from "./settings-fields";
import { CommitInput } from "./commit-input";
import { PageCountContext } from "../lib/page-zones";
import {
  dateFormats,
  DOCUMENT_FIELDS,
  DOCUMENT_SOURCE,
  formatDate,
  formatPage,
  PAGE_FORMATS,
  PAGE_NUMBER_ATTR,
} from "../lib/document-values";
import { TypographyFields } from "./typography-fields";
import { HelpLabel } from "./help-label";
import { PROPERTY_HELP } from "../lib/property-help";
import { useSourceValue } from "../lib/print-data";
import { SizeSection } from "./property-sections/size-section";
import { PositionSection } from "./property-sections/position-section";
import { SpacingSection } from "./property-sections/spacing-section";
import { AppearanceSection } from "./property-sections/appearance-section";
import { BorderSection } from "./property-sections/border-section";
import { EditorTooltip } from "./editor-tooltip";

export interface PdfTextProps
  extends
    TypographyProps,
    PositionProps,
    SizeProps,
    SpacingProps,
    AppearanceProps,
    BorderProps {
  /** Lo propio del Texto. */
  text: string;
  /**
   * El campo de la fuente que muestra, en la fila de una Tabla de datos: el
   * texto sale del registro y no se escribe. Vacío = un texto normal.
   */
  field: string;
  /**
   * Parte de una Tabla de datos (lib/data-table): se le cambia el estilo, pero
   * no se mueve, copia ni elimina.
   */
  locked: boolean;
  /**
   * De dónde sale el texto: vacío, escrito a mano; si no, la fuente del
   * documento (constants/printDataSources) y cuál de sus valores sueltos
   * muestra, por ejemplo el IGV del comprobante.
   */
  valueSource:
    | PrintDataSourceId
    | ContextSourceId
    | typeof DOCUMENT_SOURCE
    | typeof GROUP_SOURCE
    | "";
  valueKey: string;
  /**
   * Con un dato del documento (número de página, fecha): cómo se escribe
   * (lib/document-values).
   */
  valueFormat: string;
  /**
   * Con un dato (Origen y Valor): lo que se escribe si el dato llega vacío,
   * como el «—» de los tickets o «Clientes Varios» del comprobante. Vacío, no
   * se escribe nada. Mientras se edita, el texto lleva una marca.
   */
  emptyText: string;
  /**
   * Con un ancho o un alto fijo, qué hacer si el texto no entra en su caja:
   * nada (se ve todo), achicar la letra hasta que entre (sin bajar de
   * MIN_FIT_PT) o cortarlo, con «...» o sin. Con solo el ancho fijo, cortar
   * deja el texto en una línea.
   */
  overflowMode: TextOverflowMode;
}

export type TextOverflowMode = "none" | "shrink" | "ellipsis" | "clip";

const OVERFLOW_OPTIONS: { value: TextOverflowMode; label: string }[] = [
  { value: "none", label: "Mostrarlo todo" },
  { value: "shrink", label: "Achicar la letra" },
  { value: "ellipsis", label: "Cortar con «...»" },
  { value: "clip", label: "Cortar sin «...»" },
];

const DEFAULT_PROPS: PdfTextProps = {
  text: "Texto",
  field: "",
  locked: false,
  valueSource: "",
  valueKey: "",
  valueFormat: "",
  emptyText: "",
  overflowMode: "none",
  ...DEFAULT_TYPOGRAPHY,
  ...DEFAULT_POSITION,
  ...DEFAULT_SIZE,
  // El texto mide lo que su contenido.
  widthMode: "hug",
  heightMode: "hug",
  ...DEFAULT_SPACING,
  ...DEFAULT_APPEARANCE,
  ...DEFAULT_BORDER,
};

/** Cada cuánto (ms) entra en el historial lo que se escribe en el lienzo. */
const TYPING_HISTORY_THROTTLE_MS = 500;

/** El texto del elemento editable, sin el salto final que añade el navegador. */
const readText = (element: HTMLElement) => element.innerText.replace(/\n$/, "");

/** Al empezar a escribir en el lienzo, el texto queda seleccionado entero. */
const focusAndSelectAll = (element: HTMLElement) => {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};

export const PdfText: UserComponent<Partial<PdfTextProps>> = (props) => {
  const p = { ...DEFAULT_PROPS, ...props };
  const [editing, setEditing] = useState(false);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const {
    id,
    actions: { setProp },
  } = useNode();
  const { actions: editorActions } = useEditor();
  // En la fila de una Tabla: el registro que le toca.
  const dataRow = useDataRow();
  const dataField =
    p.field && dataRow ? fieldOf(dataRow.source, p.field) : undefined;
  // Un valor del documento: en el editor, el de ejemplo de su fuente.
  // O un dato de la sesión (la empresa, el cajero): el de verdad.
  const contextValue = useContextValues();
  const contextSource =
    p.valueSource && isContextSource(p.valueSource)
      ? CONTEXT_SOURCES[p.valueSource]
      : null;
  const groupTitle = useContext(GroupTitleContext);
  // Un dato del propio documento: el número de página o la fecha.
  const documentValue = p.valueSource === DOCUMENT_SOURCE;
  const pageCount = useContext(PageCountContext);
  // El valor del documento que se imprime o, en el editor, el de ejemplo.
  const sourceValue = useSourceValue();
  // Un dato del grupo (en el pie de grupo de una Tabla): el del primero; sus
  // copias lo cambian por el de cada grupo (GROUP_VALUE_ATTR).
  const groupValue = p.valueSource === GROUP_SOURCE;
  const groupFooter = useContext(GroupFooterContext);
  const groupText = (() => {
    if (!groupValue) return "";
    if (!groupFooter) return `{${p.valueKey}}`;
    if (p.valueKey === GROUP_NAME_KEY) return groupFooter.name;
    const field = fieldOf(groupFooter.source, p.valueKey);
    return field ? formatFieldValue(field, groupFooter.row[p.valueKey]) : "";
  })();
  const valueSource =
    p.valueSource && !contextSource && !documentValue && !groupValue
      ? PRINT_DATA_SOURCES[p.valueSource as PrintDataSourceId]
      : null;
  const valueField =
    valueSource?.values?.find((field) => field.key === p.valueKey) ?? null;
  const mapped =
    Boolean(p.field) ||
    Boolean(valueSource) ||
    Boolean(contextSource) ||
    documentValue ||
    groupValue;
  // El texto al entrar a escribir: el editable no lo pinta React (perdería el
  // cursor en cada letra), se le pone una vez.
  const textRef = useRef(p.text);
  textRef.current = p.text;
  const { ref, outline, enabled, nodeProps } = useEditableNode({
    draggable: !editing,
  });
  // Con varias páginas, dónde se parte el texto (lib/pagination).
  const splits = useTextSplits(id);
  const editable = enabled && !mapped;
  // «Achicar la letra»: el tamaño de letra con que entra en su caja.
  const fitPt = useShrinkToFit(
    p,
    editing,
    // Lo que se ve: si cambia (un dato de la configuración, una fila), se
    // vuelve a medir.
    JSON.stringify([
      p.text,
      p.valueSource,
      p.valueKey,
      p.field,
      dataRow?.row,
      contextSource ? contextValue(contextSource.id, p.valueKey) : "",
    ]),
  );
  const parentDirection = useParentDirection();
  const freeOrigin = useFreeOrigin();

  useEffect(() => {
    if (editing && editableRef.current) {
      editableRef.current.innerText = textRef.current;
      focusAndSelectAll(editableRef.current);
    }
  }, [editing]);

  // Lo sabe el resto del editor (los tiradores se ocultan mientras se escribe)
  // sin pasar por el historial. Solo al entrar o salir de escribir, no al
  // montarse: cada acción de craft recalcula a todos los componentes, y una
  // Tabla de datos monta decenas de Textos de una vez.
  const wasEditingRef = useRef(false);
  useEffect(() => {
    if (editing === wasEditingRef.current) return;
    wasEditingRef.current = editing;
    editorActions.history.ignore().setCustom(id, (custom) => {
      custom.editing = editing;
    });
  }, [editing, editorActions, id]);

  // Si el editor se desactiva a mitad de una edición, se sale de ella.
  useEffect(() => {
    if (!enabled) setEditing(false);
  }, [enabled]);

  const style: CSSProperties = {
    boxSizing: "border-box",
    minWidth: 0,
    ...sizeStyle(p, parentDirection, p.positionFree),
    ...spacingStyle(p),
    ...positionStyle(p, freeOrigin),
    ...typographyStyle(p),
    ...(fitPt !== null && { fontSize: `${fitPt}pt` }),
    ...appearanceStyle(p),
    ...borderStyle(p),
    // Los saltos de línea del texto se respetan, como en el PDF.
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    ...(!editing && cutStyle(p)),
    ...outline,
  };

  const finishEditing = (element: HTMLElement) => {
    const text = readText(element);
    setProp((draft: PdfTextProps) => {
      draft.text = text;
    });
    setEditing(false);
  };

  return (
    // Un texto que sale de los datos no se escribe: sin tooltip (en una Tabla
    // de datos serían uno por celda).
    <EditorTooltip
      label={mapped ? undefined : "Doble clic para escribir"}
      disabled={!editable || editing}
    >
      <div
        ref={ref}
        {...nodeProps}
        style={style}
        onDoubleClick={() => editable && setEditing(true)}
      >
        {editing ? (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            style={{ outline: "none", cursor: "text" }}
            // Contenido (el panel) sigue a lo que se escribe, letra a letra.
            onInput={(e) => {
              const text = readText(e.currentTarget);
              setProp((draft: PdfTextProps) => {
                draft.text = text;
              }, TYPING_HISTORY_THROTTLE_MS);
            }}
            onBlur={(e) => finishEditing(e.currentTarget)}
            // Mientras se escribe, el clic derecho es el del navegador
            // (copiar, pegar, corrector), no el menú de la hoja.
            onContextMenu={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              // Escape termina la edición; las demás teclas no llegan a craft.
              if (e.key === "Escape") e.currentTarget.blur();
              e.stopPropagation();
            }}
          />
        ) : groupValue ? (
          <span {...{ [GROUP_VALUE_ATTR]: p.valueKey }}>
            {groupText || p.emptyText}
          </span>
        ) : documentValue ? (
          p.valueKey === "page" ? (
            // La hoja escribe aquí el de la página en que cae.
            <span {...{ [PAGE_NUMBER_ATTR]: p.valueFormat || "n" }}>
              {formatPage(p.valueFormat, 1, pageCount)}
            </span>
          ) : (
            formatDate(p.valueFormat)
          )
        ) : contextSource ? (
          contextText(
            contextValue(contextSource.id, p.valueKey) || p.emptyText,
            splits,
          )
        ) : valueSource ? (
          withSplits(
            valueField
              ? formatFieldValue(
                  valueField,
                  sourceValue(valueSource, p.valueKey),
                ) || p.emptyText
              : `{${p.valueKey}}`,
            splits,
          )
        ) : mapped ? (
          // Fuera de una fila (no debería pasar) se ve qué campo es.
          withSplits(
            dataField
              ? formatFieldValue(dataField, dataRow?.row[p.field])
              : `{${p.field}}`,
            splits,
          )
        ) : groupTitle !== null ? (
          // El título de una Tabla agrupada: el nombre del primer grupo.
          withSplits(groupTitle, splits)
        ) : p.text ? (
          withSplits(p.text, splits)
        ) : enabled ? (
          <span style={{ opacity: 0.4 }}>Texto vacío</span>
        ) : null}
      </div>
    </EditorTooltip>
  );
};

/** Un pt en mm. */
const PT_MM = 25.4 / 72;

/**
 * «Cortar» (con «...» o sin): con el alto fijo, el texto se corta en la
 * última línea que entra; con solo el ancho fijo, queda en una línea y se
 * corta al final.
 */
function cutStyle(p: PdfTextProps): CSSProperties {
  const boxed = p.widthMode === "fixed" || p.heightMode === "fixed";
  if (!boxed || (p.overflowMode !== "ellipsis" && p.overflowMode !== "clip"))
    return {};
  const ellipsis = p.overflowMode === "ellipsis";
  if (p.heightMode !== "fixed") {
    return {
      overflow: "hidden",
      whiteSpace: "pre",
      ...(ellipsis && { textOverflow: "ellipsis" }),
    };
  }
  if (!ellipsis) return { overflow: "hidden" };
  // Las líneas que entran en el alto de la caja (sin su relleno ni borde).
  const inner =
    p.heightMm -
    p.padding.top -
    p.padding.bottom -
    p.borderWidth.top -
    p.borderWidth.bottom;
  const lines = Math.max(
    1,
    Math.floor(inner / (p.fontSizePt * PT_MM * p.lineHeight)),
  );
  return {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
  };
}

/** Lo más que se achica la letra con «Achicar la letra», en pt. */
const MIN_FIT_PT = 4;

/**
 * «Achicar la letra»: si el texto no cabe en su caja (de ancho o alto
 * fijo), el tamaño de letra más grande con que cabe, buscado probando sobre
 * el propio elemento; null si no hace falta. Se vuelve a buscar cuando
 * cambia lo que se ve (`content`), la caja o la letra. Mientras se escribe,
 * no.
 */
function useShrinkToFit(
  p: PdfTextProps,
  editing: boolean,
  content: string,
): number | null {
  const { dom } = useNode((node) => ({ dom: node.dom }));
  const [fitPt, setFitPt] = useState<number | null>(null);
  const active =
    p.overflowMode === "shrink" &&
    !editing &&
    (p.widthMode === "fixed" || p.heightMode === "fixed");

  useLayoutEffect(() => {
    if (!active || !dom) {
      setFitPt(null);
      return;
    }
    const fits = () =>
      dom.scrollHeight <= dom.clientHeight + 0.5 &&
      dom.scrollWidth <= dom.clientWidth + 0.5;
    const previous = dom.style.fontSize;
    dom.style.fontSize = `${p.fontSizePt}pt`;
    let result: number | null = null;
    if (!fits()) {
      // Búsqueda a la décima de pt entre el mínimo y el tamaño elegido.
      let low = MIN_FIT_PT;
      let high = p.fontSizePt;
      while (high - low > 0.1) {
        const middle = (low + high) / 2;
        dom.style.fontSize = `${middle}pt`;
        if (fits()) low = middle;
        else high = middle;
      }
      result = Math.floor(low * 10) / 10;
    }
    dom.style.fontSize = previous;
    setFitPt(result);
  }, [
    active,
    dom,
    content,
    p.fontSizePt,
    p.widthMm,
    p.heightMm,
    p.lineHeight,
    p.letterSpacingPt,
    p.fontFamily,
    p.fontWeight,
  ]);

  return active ? fitPt : null;
}

/**
 * El texto con un espacio en cada salto de página: lo de después empieza en
 * la página siguiente. El espacio lleva su alto en TEXT_GAP_ATTR, para
 * medirlo sin él.
 */
function withSplits(text: string, splits: TextSplit[]) {
  if (!splits.length) return text;
  const parts: (string | JSX.Element)[] = [];
  let previous = 0;
  for (const split of splits) {
    parts.push(text.slice(previous, split.index));
    parts.push(
      <span
        key={split.index}
        {...{ [TEXT_GAP_ATTR]: split.gap }}
        style={{ display: "block", height: split.gap }}
      />,
    );
    previous = split.index;
  }
  parts.push(text.slice(previous));
  return parts;
}

/**
 * Un dato de la configuración; si está vacío (un parámetro sin configurar),
 * dice «Sin configurar».
 */
function contextText(value: string, splits: TextSplit[]) {
  return withSplits(value || "Sin configurar", splits);
}

/** Cualquier texto vale; vacío, no se escribe nada. */
const validateEmptyText = (text: string) => ({ value: text });

/** Los dos grupos del Origen: de dónde puede salir el texto. */
const ORIGIN_GROUPS = {
  lists: "Listas de datos",
  context: "Configuración",
  document: "Documento",
  group: "Grupo",
};

/**
 * En el panel, «Seleccionar»: sin origen, el texto se escribe a mano. El
 * Select no admite un valor vacío.
 */
const MANUAL_ORIGIN = "manual";

function PdfTextSettings() {
  const { props, set } = useNodeProps<PdfTextProps>(DEFAULT_PROPS);
  const { id } = useNode();
  const { source } = useEditor((state) => ({
    source: tableSourceOf(state.nodes, id),
  }));
  // Las fuentes del documento que tienen valores sueltos para mostrar.
  const valueSources = useDataSources().filter((item) => item.values?.length);
  const contextSource =
    props.valueSource && isContextSource(props.valueSource)
      ? CONTEXT_SOURCES[props.valueSource]
      : null;
  const documentValue = props.valueSource === DOCUMENT_SOURCE;
  const groupValue = props.valueSource === GROUP_SOURCE;
  // Dentro del pie de grupo de una Tabla: los datos de su lista.
  const { footerSource } = useEditor((state) => ({
    footerSource: groupFooterSourceOf(state.nodes, id),
  }));
  const valueSource =
    props.valueSource && !contextSource && !documentValue && !groupValue
      ? PRINT_DATA_SOURCES[props.valueSource as PrintDataSourceId]
      : null;
  // La del Texto aunque su documento ya no la ofrezca: que se vea cuál es.
  // Se compara por id: las del documento son copias (sourcesOf), no el mismo
  // objeto del catálogo, y con includes salía dos veces.
  const listSources =
    valueSource && !valueSources.some((item) => item.id === valueSource.id)
      ? [valueSource, ...valueSources]
      : valueSources;
  // Lo que se elige en «Valor»: los valores de la fuente elegida.
  const valueOptions = contextSource
    ? contextSource.fields.map((item) => ({
        value: item.key,
        label: item.label,
      }))
    : (valueSource?.values ?? [])
        // Lo de un QR lo muestra el componente QR.
        .filter((item) => item.kind !== "qr")
        .map((item) => ({ value: item.key, label: item.label }));

  // Al elegir un origen, arranca con su primer valor.
  const changeOrigin = (origin: string) => {
    // Del grupo: el nombre o un dato de su última fila.
    if (origin.startsWith(`${GROUP_SOURCE}:`)) {
      set("valueSource", GROUP_SOURCE);
      set("valueKey", origin.slice(GROUP_SOURCE.length + 1));
      return;
    }
    // Del documento: el número de página o la fecha, con su primer formato.
    if (origin.startsWith(`${DOCUMENT_SOURCE}:`)) {
      const key = origin.slice(DOCUMENT_SOURCE.length + 1);
      set("valueSource", DOCUMENT_SOURCE);
      set("valueKey", key);
      set("valueFormat", key === "page" ? "page_of" : "short");
      return;
    }
    if (isContextSource(origin)) {
      set("valueSource", origin);
      set("valueKey", CONTEXT_SOURCES[origin].fields[0]?.key ?? "");
      return;
    }
    const next = listSources.find((item) => item.id === origin) ?? null;
    set("valueSource", next ? next.id : "");
    set("valueKey", next?.values?.[0]?.key ?? "");
  };

  return (
    <div className="flex flex-col">
      {/* Lo propio del componente: sin nombre, se sobreentiende. */}
      <PropertySection>
        {props.field ? (
          // En una fila de una Tabla de datos el texto sale de la fuente de
          // la Tabla: se ve cuál, pero se cambia desde la Tabla (Columnas).
          <>
            <SelectField
              label="Origen"
              help={PROPERTY_HELP.tableTextOrigin}
              value={source?.id ?? props.field}
              options={[
                {
                  value: source?.id ?? props.field,
                  label: source?.label ?? props.field,
                },
              ]}
              onChange={() => undefined}
              disabled
            />
            {/* Solo en las filas de una Tabla de datos: el dato de su columna. */}
            <SelectField
              label="Valor"
              help={PROPERTY_HELP.tableTextValue}
              value={props.field}
              options={[
                {
                  value: props.field,
                  label: `Dato de la tabla: ${
                    (source && fieldOf(source, props.field)?.label) ??
                    props.field
                  }`,
                },
              ]}
              onChange={() => undefined}
              disabled
            />
          </>
        ) : (
          <>
            {/* En las partes de una Tabla no: su texto ya lo decide ella. */}
            {!props.locked && (
              <SelectField
                label="Origen"
                help={PROPERTY_HELP.textOrigin}
                value={
                  documentValue
                    ? `${DOCUMENT_SOURCE}:${props.valueKey}`
                    : groupValue
                      ? `${GROUP_SOURCE}:${props.valueKey}`
                      : props.valueSource || MANUAL_ORIGIN
                }
                options={[
                  { value: MANUAL_ORIGIN, label: "Seleccionar" },
                  ...listSources.map((item) => ({
                    value: item.id,
                    label: item.label,
                    group: ORIGIN_GROUPS.lists,
                  })),
                  ...Object.values(CONTEXT_SOURCES).map((item) => ({
                    value: item.id,
                    label: item.label,
                    group: ORIGIN_GROUPS.context,
                  })),
                  ...DOCUMENT_FIELDS.map((item) => ({
                    value: `${DOCUMENT_SOURCE}:${item.key}`,
                    label: item.label,
                    group: ORIGIN_GROUPS.document,
                  })),
                  // En el pie de grupo de una Tabla: el grupo.
                  ...(footerSource
                    ? [
                        {
                          value: `${GROUP_SOURCE}:${GROUP_NAME_KEY}`,
                          label: "Nombre del grupo",
                          group: ORIGIN_GROUPS.group,
                        },
                        ...[
                          ...footerSource.fields,
                          ...(footerSource.values ?? []),
                        ]
                          .filter(
                            (field, index, all) =>
                              all.findIndex(
                                (item) => item.key === field.key,
                              ) === index,
                          )
                          .filter((field) =>
                            footerSource.fields.some(
                              (item) => item.key === field.key,
                            ),
                          )
                          .map((field) => ({
                            value: `${GROUP_SOURCE}:${field.key}`,
                            label: field.label,
                            group: ORIGIN_GROUPS.group,
                          })),
                      ]
                    : []),
                ]}
                onChange={changeOrigin}
              />
            )}
            {documentValue ? (
              // Del documento: solo cómo se escribe.
              <SelectField
                label="Formato"
                help={PROPERTY_HELP.valueFormat}
                value={props.valueFormat}
                options={
                  props.valueKey === "page" ? PAGE_FORMATS : dateFormats()
                }
                onChange={(value) => set("valueFormat", value)}
              />
            ) : valueSource || contextSource ? (
              <>
                <SelectField
                  label="Valor"
                  help={PROPERTY_HELP.textValue}
                  value={props.valueKey}
                  options={valueOptions}
                  onChange={(value) => set("valueKey", value)}
                />
                <PanelField
                  label={
                    <HelpLabel
                      label="Si está vacío, escribir"
                      help={PROPERTY_HELP.emptyText}
                    />
                  }
                >
                  {(id) => (
                    <CommitInput
                      id={id}
                      value={props.emptyText}
                      validate={validateEmptyText}
                      onCommit={(value) => set("emptyText", value)}
                      placeholder="Ej.: —"
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  )}
                </PanelField>
              </>
            ) : (
              <PanelField
                label={
                  <HelpLabel label="Contenido" help={PROPERTY_HELP.content} />
                }
              >
                {(id) => (
                  <Textarea
                    id={id}
                    rows={4}
                    value={props.text}
                    onChange={(e) => set("text", e.target.value)}
                    className="text-[12px] md:text-[12px]"
                  />
                )}
              </PanelField>
            )}
          </>
        )}
        <TypographyFields props={props} set={set} />
        {/* Al final de lo propio. Solo con una caja fija: si no, crece. */}
        {(props.widthMode === "fixed" || props.heightMode === "fixed") && (
          <SelectField
            label="Ajuste del texto"
            help={PROPERTY_HELP.overflowMode}
            value={props.overflowMode}
            options={OVERFLOW_OPTIONS}
            onChange={(value) => set("overflowMode", value)}
          />
        )}
      </PropertySection>
      {!props.locked && <PositionSection props={props} set={set} />}
      <SizeSection props={props} set={set} />
      <SpacingSection props={props} set={set} />
      <AppearanceSection props={props} set={set} />
      <BorderSection props={props} set={set} />
    </div>
  );
}

PdfText.craft = {
  displayName: "Texto",
  props: DEFAULT_PROPS,
  rules: {
    // El texto no recibe otros componentes dentro.
    canMoveIn: () => false,
    canDrag: (node) => !node.data.props.locked,
  },
  related: {
    settings: PdfTextSettings,
  },
};
