import type { ReactElement, ReactNode } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfDataTable, type EmptyColumns } from "../components/pdf-data-table";
import { box, hideIfEmpty, setting, sides, text } from "./parts";
import { pageZoneProps } from "../lib/page-zones";
import type { PrintDataSourceId } from "../../constants/printDataSources";
import { DOCUMENT_SOURCE } from "../lib/document-values";

/**
 * Las hojas de taller de hoy (buildSheetPdf en shared/utils/sheetDocument.ts):
 * A4 apaisado con la empresa a la izquierda y el título grande a la derecha,
 * la banda gris de identificación, dos fichas lado a lado, la tabla de la
 * sección, los totales a la derecha, las observaciones en su recuadro y, en
 * cada página, el pie con la fecha de generación. El título de cada sección
 * es el de su Tabla: si la sección sigue en otra página, sale con
 * «(continuación)».
 *
 * Cada documento (la Orden de compra, por ahora) dice qué lleva cada parte.
 * Un dato que no llega se oculta, como hoy («un hueco se lee como un dato que
 * falta»).
 */

/** Los grises del motor: texto, rótulos, líneas y bandas. */
const INK = "rgba(30, 30, 30, 1)";
const SOFT = "rgba(110, 110, 110, 1)";
const LINE = "rgba(205, 205, 205, 1)";
const BAND = "rgba(242, 242, 242, 1)";

type SheetSource =
  | "purchase_order"
  | "service_order"
  | "customer_service_order"
  | "production_order"
  | "material_requirement"
  | "recipe"
  | "style_operations"
  | "bundle_sheet"
  | "work_log_batch";

/** Un dato de una ficha: rótulo pequeño en mayúsculas y el valor en negrita. */
interface SheetField {
  label: string;
  key: string;
  /** La fecha del documento (el día en que se genera), no un dato. */
  today?: boolean;
}

/** Lo que lleva cada documento en cada parte de la hoja. */
interface SheetConfig {
  title: string;
  /** Si el título sale de los datos (cambia con la orden); `title` si no llega. */
  titleKey?: string;
  /** La banda de arriba, en tres columnas (cada una, de arriba abajo). */
  identification: SheetField[][];
  /** La ficha de la izquierda; sin ninguna ficha, no va esa parte. */
  general?: { title: string; columns: SheetField[][] };
  /** La ficha de la derecha; sin ella, la de la izquierda va sola. */
  technical?: { title: string; columns: SheetField[][] };
  /**
   * Las fotos de referencia, entre las fichas y las tablas: una al lado de
   * otra, con su borde (una Tabla con las filas en fila).
   */
  images?: { title: string; source: PrintDataSourceId; sampleRows: number };
  /** El título de la sección de la tabla y sus filas de ejemplo. */
  sectionTitle: string;
  sampleRows: number;
  /**
   * Lo que dice la primera tabla si el documento no trae filas; sin él, la
   * tabla no sale (como las hojas de hoy).
   */
  sectionEmpty?: string;
  /** La lista de la primera tabla, si no es la del documento. */
  sectionSource?: PrintDataSourceId;
  /** El total al pie de la primera tabla: [rótulo, dato]. */
  sectionSubtotal?: [string, string];
  /**
   * La primera tabla agrupada por una columna (su título dice el de cada
   * grupo) y sin las columnas vacías, como las secciones por clase del
   * Requerimiento de hoy.
   */
  sectionGroupBy?: string;
  /**
   * El pie de cada grupo: su rótulo (escrito o un dato), si lleva el nombre
   * del grupo y el dato del total.
   */
  sectionGroupFooter?: {
    label?: string;
    labelKey?: string;
    name?: boolean;
    valueKey?: string;
  };
  hideEmptyColumns?: EmptyColumns;
  /**
   * Más secciones después de la primera, cada una con su lista y, si tiene,
   * su total al pie ([rótulo, dato de la fuente principal]).
   */
  moreSections?: {
    title: string;
    source: PrintDataSourceId;
    sampleRows: number;
    subtotal?: [string, string];
    /** Como `sectionEmpty`, para esta tabla. */
    empty?: string;
  }[];
  /**
   * Los totales, de arriba abajo: [rótulo, dato, dato del rótulo si cambia
   * con la orden].
   */
  totals: [string, string, string?][];
  /** Lo que va siempre en Observaciones, después del dato (condiciones). */
  conditions?: string[];
  /** La nota al pie del documento (un dato), en pequeño. */
  footnoteKey?: string;
  /** Notas al pie fijas, en pequeño (se cambian escribiéndolas). */
  footnotes?: string[];
}

const SHEETS: Record<SheetSource, SheetConfig> = {
  work_log_batch: {
    title: "COMPROBANTE DE REGISTRO",
    identification: [
      [{ label: "Operario", key: "operator" }],
      [{ label: "Día trabajado", key: "workedOn" }],
      [{ label: "Registrado", key: "registeredAt" }],
    ],
    sectionTitle: "Tickets y cupones registrados",
    sectionEmpty: "No se registró ningún ticket en esta sesión",
    sampleRows: 7,
    totals: [
      ["Tickets", "recordCount"],
      ["Buenas", "goodTotal"],
      ["Falladas", "badTotal"],
      ["Minutos ganados", "minutesTotal"],
      ["A pagar", "amountTotal"],
    ],
    footnotes: [
      "Minutos ganados: prendas buenas × tiempo estándar de la operación.",
      "A pagar: prendas buenas × tarifa destajo al registrar. «—» = la operación no tiene pago.",
      "Revisa que estén todos tus tickets. Si falta alguno, avísalo antes del cierre de la semana.",
    ],
  },
  bundle_sheet: {
    title: "HOJA DE PAQUETES",
    identification: [
      [
        { label: "O. Serv.", key: "orderCode" },
        { label: "Modelo", key: "models" },
      ],
      [
        { label: "Cliente", key: "customer" },
        // La de hoy, como el papel de hoy.
        { label: "Fecha", key: "", today: true },
      ],
      [],
    ],
    // Una sección por estilo y color, con sus prendas al pie.
    sectionTitle: "Paquetes",
    sectionGroupBy: "garment",
    sectionGroupFooter: { label: "Prendas", valueKey: "garmentTotal" },
    sampleRows: 11,
    totals: [
      ["Paquetes", "bundleCount"],
      ["Prendas", "garmentCount"],
    ],
    footnotes: [
      "# Paq: número del paquete en la orden. Inicio - Fin: numeración de las prendas del paquete.",
    ],
  },
  style_operations: {
    title: "OPERACIONES",
    identification: [
      [
        { label: "Orden de producción", key: "orderCode" },
        { label: "Emisión", key: "issueDate" },
      ],
      [
        { label: "Estado", key: "status" },
        // La de hoy, como el papel de hoy.
        { label: "Impreso", key: "", today: true },
      ],
      [],
    ],
    general: {
      title: "Estilo",
      columns: [
        [
          { label: "Artículo", key: "article" },
          { label: "Cliente", key: "customer" },
        ],
      ],
    },
    technical: {
      title: "Producción",
      columns: [
        [
          { label: "O/Comercial", key: "customerOrderRef" },
          { label: "Jornada", key: "workday" },
        ],
      ],
    },
    // Una sección por fase y bloque, con el total del bloque al pie.
    sectionTitle: "Operaciones",
    sectionGroupBy: "section",
    // «Total bloque» o «Total bloque / fase» (en el último de la fase).
    sectionGroupFooter: { labelKey: "blockLabel", valueKey: "blockTotal" },
    // Un proceso sin operaciones: solo Operación y Máquina, como hoy.
    hideEmptyColumns: "group",
    sampleRows: 11,
    moreSections: [
      {
        title: "Minutos por máquina",
        source: "style_operations_machines",
        sampleRows: 5,
        subtotal: ["TOTAL GENERAL", "machinesTotal"],
      },
    ],
    totals: [
      ["T.STD total", "totalStd"],
      ["Tarifa total", "totalRate"],
    ],
    footnotes: [
      "T.STD: minutos por prenda. Tarifa: tarifa destajo en S/ por prenda buena.",
      "Prod/h = 60 / T.STD; Prod/día = 480 min de jornada / T.STD.",
    ],
  },
  recipe: {
    title: "RECETA",
    identification: [
      [
        { label: "Receta", key: "recipe" },
        { label: "Modelo", key: "modelCode" },
      ],
      [
        { label: "Prenda", key: "garment" },
        { label: "F. registro", key: "registeredAt" },
      ],
      [],
    ],
    general: {
      title: "Materiales",
      columns: [
        [{ label: "Materiales distintos", key: "distinctMaterials" }],
        [{ label: "Tipos", key: "types" }],
      ],
    },
    // Una sección por clase, como hoy; «Por prenda» solo sale si alguna
    // prenda usa otra cantidad.
    sectionTitle: "Materiales",
    sectionEmpty: "La receta todavía no tiene materiales.",
    sectionGroupBy: "materialClass",
    // Al pie de cada clase, «SUBTOTAL TELAS» y su total, como hoy.
    sectionGroupFooter: {
      label: "SUBTOTAL",
      name: true,
      valueKey: "classSubtotal",
    },
    hideEmptyColumns: "table",
    sampleRows: 10,
    totals: [["TOTAL POR PRENDA", "total"]],
    footnoteKey: "footnote",
  },
  material_requirement: {
    title: "REQUERIMIENTO DE MATERIALES",
    identification: [
      [
        { label: "N.º de requerimiento", key: "requirementNumber" },
        { label: "Orden de producción", key: "orderCode" },
      ],
      [
        // La de hoy: el día en que se genera, como el papel de hoy.
        { label: "Fecha de emisión", key: "", today: true },
        { label: "Fecha de la orden", key: "orderDate" },
      ],
      [
        { label: "Entrega comprometida", key: "promisedDate" },
        { label: "Cantidad solicitada", key: "requestedQuantity" },
      ],
    ],
    general: {
      title: "Datos generales",
      columns: [
        [
          { label: "Solicitante", key: "requester" },
          { label: "Categoría", key: "categories" },
        ],
      ],
    },
    technical: {
      title: "Especificaciones técnicas",
      columns: [
        [
          { label: "Código de modelo", key: "modelCodes" },
          { label: "Tipo de material", key: "materialTypes" },
        ],
        [{ label: "Materiales distintos", key: "distinctMaterials" }],
      ],
    },
    // Una sección por clase de material, como hoy: la Tabla agrupada por la
    // clase, sin las columnas que no tienen ningún dato.
    sectionTitle: "Materiales",
    sectionGroupBy: "materialClass",
    hideEmptyColumns: "table",
    sampleRows: 12,
    totals: [
      ["Materiales por comprar", "toBuy"],
      ["Costo estimado", "estimatedCost"],
    ],
    // Las notas fijas de hoy (cómo leer el papel).
    footnotes: [
      "El faltante compara contra el stock total del material, sin repartirlo entre las prendas que lo comparten.",
      "«En talleres» es la parte de ese stock que ya está en un almacén de proveedor: cuenta como stock, pero no hace falta volver a enviarla.",
      "El costo es el que la orden congeló al asignar cada receta, no el precio vigente del material.",
    ],
  },
  production_order: {
    title: "ORDEN DE PRODUCCIÓN",
    identification: [
      [
        { label: "Orden de producción", key: "orderCode" },
        { label: "Nombre", key: "name" },
      ],
      [
        { label: "Tipo", key: "className" },
        { label: "Estado", key: "status" },
      ],
      [
        { label: "Fecha de emisión", key: "issueDate" },
        { label: "Entrega comprometida", key: "promisedDate" },
      ],
    ],
    general: {
      title: "Datos generales",
      columns: [
        [
          { label: "Total de prendas", key: "garmentsTotal" },
          { label: "Categorías", key: "categories" },
        ],
        [{ label: "Etiquetas", key: "tags" }],
      ],
    },
    images: {
      title: "Referencia de la prenda",
      source: "production_order_images",
      sampleRows: 6,
    },
    // Primero las prendas, después la ruta.
    sectionTitle: "Prendas",
    sectionSource: "production_order_garments",
    sectionSubtotal: ["TOTAL PRENDAS", "garmentsTotal"],
    sampleRows: 4,
    moreSections: [
      {
        title: "Ruta de producción",
        source: "production_order",
        sampleRows: 6,
      },
    ],
    totals: [],
  },
  customer_service_order: {
    title: "ORDEN DE SERVICIO",
    titleKey: "documentTitle",
    identification: [
      [
        { label: "N.°", key: "number" },
        { label: "Fecha", key: "date" },
      ],
      [
        { label: "Cliente", key: "customerName" },
        { label: "Documento", key: "customerDocument" },
      ],
      [],
    ],
    general: {
      title: "Pedido",
      columns: [
        [
          { label: "Qué se produce", key: "subject" },
          { label: "Prendas", key: "garmentCount" },
        ],
        [{ label: "Precio por prenda", key: "unitTotal" }],
      ],
    },
    technical: {
      title: "Condiciones",
      columns: [
        [
          { label: "IGV", key: "taxMode" },
          { label: "Moneda", key: "currency" },
        ],
        [{ label: "Condición de pago", key: "paymentTerms" }],
      ],
    },
    sectionTitle: "Operaciones",
    sectionEmpty: "Sin operaciones",
    sampleRows: 6,
    totals: [
      ["Subtotal", "subtotal"],
      ["IGV", "igv", "igvLabel"],
      ["Total", "total"],
    ],
    footnoteKey: "footnote",
  },
  service_order: {
    title: "ORDEN DE SERVICIO",
    identification: [
      [
        { label: "Orden de servicio", key: "orderNumber" },
        { label: "Proceso", key: "processName" },
      ],
      [
        { label: "Proveedor", key: "supplierName" },
        { label: "Orden de producción", key: "productionOrders" },
      ],
      [
        { label: "F. emisión", key: "issueDate" },
        { label: "F. entrega", key: "deliveryDate" },
      ],
    ],
    general: {
      title: "Proveedor",
      columns: [
        [
          { label: "Razón social", key: "supplierName" },
          { label: "RUC / DNI", key: "supplierDocument" },
        ],
        [{ label: "Teléfono", key: "supplierPhone" }],
      ],
    },
    technical: {
      title: "Encargo",
      columns: [
        [
          { label: "Solicitud", key: "request" },
          { label: "Servicios", key: "serviceCount" },
        ],
        [
          { label: "Cantidad pedida", key: "orderedQuantity" },
          { label: "Moneda", key: "currency" },
        ],
      ],
    },
    sectionTitle: "Servicios",
    sectionEmpty: "Esta orden no tiene servicios registrados.",
    sampleRows: 3,
    moreSections: [
      {
        title: "Prendas",
        source: "service_order_garments",
        empty: "No hay prendas vinculadas a esta orden.",
        sampleRows: 4,
        subtotal: ["TOTAL PRENDAS", "garmentsTotal"],
      },
    ],
    totals: [
      ["Subtotal", "subtotal"],
      ["IGV 18%", "igv"],
      ["TOTAL", "total"],
    ],
    // Las condiciones fijas de hoy (CONDICIONES en serviceOrderDocument);
    // se cambian escribiéndolas.
    conditions: [
      "La empresa proveerá los materiales necesarios, previo acuerdo con el proveedor, para cumplir la fecha de entrega acordada.",
      "El proveedor debe devolver los excedentes de avíos enviados en esta orden.",
      "El pago se realiza una vez recepcionada la totalidad de las prendas con conformidad de recepción.",
    ],
  },
  purchase_order: {
    title: "ORDEN DE COMPRA",
    identification: [
      [
        { label: "Orden de compra", key: "orderCode" },
        { label: "Proveedor", key: "supplierName" },
      ],
      [
        { label: "F. emisión", key: "issueDate" },
        { label: "F. entrega", key: "deliveryDate" },
      ],
      [],
    ],
    general: {
      title: "Proveedor",
      columns: [
        [
          { label: "Razón social", key: "supplierName" },
          { label: "RUC / DNI", key: "supplierDocument" },
        ],
        [{ label: "Teléfono", key: "supplierPhone" }],
      ],
    },
    technical: {
      title: "Pedido",
      columns: [
        [
          { label: "Solicitud", key: "request" },
          { label: "Materiales distintos", key: "distinctMaterials" },
        ],
        [
          { label: "Cantidad total", key: "totalQuantity" },
          { label: "Moneda", key: "currency" },
        ],
      ],
    },
    sectionTitle: "Materiales",
    sectionEmpty: "Esta compra no tiene materiales registrados.",
    sampleRows: 40,
    totals: [
      ["Subtotal", "subtotal"],
      ["IGV 18%", "igv"],
      ["TOTAL", "total"],
    ],
  },
};

function sheetDesign(
  page: Partial<PdfContainerProps>,
  source: SheetSource,
): ReactElement {
  const sheet = SHEETS[source];
  const data = (key: string, props: Partial<PdfTextProps> = {}) =>
    text("", { valueSource: source, valueKey: key, color: INK, ...props });

  /** El título de una sección, en su Tabla (sale y se oculta con ella). */
  const sectionTitleBox = (top: number): Partial<PdfContainerProps> => ({
    heightMode: "fixed",
    heightMm: 4.6,
    padding: sides({}),
    margin: sides({ top, bottom: 1.8 }),
    borderColor: LINE,
    borderWidth: sides({ bottom: 0.3 }),
  });
  const sectionTitleText = (value: string): Partial<PdfTextProps> => ({
    text: value,
    fontSizePt: 8.5,
    fontWeight: 700,
    color: INK,
    textCase: "upper",
  });

  /**
   * La tabla de una sección: el encabezado gris en mayúsculas, repetido en
   * cada página, y una línea fina bajo cada fila.
   */
  const table = (
    tableSource: PrintDataSourceId,
    sampleRows: number,
    sectionTitle: string,
    index: number,
    grouping: {
      groupBy?: string;
      hideEmptyColumns?: EmptyColumns;
      footer?: SheetConfig["sectionGroupFooter"];
    } = {},
    empty?: string,
  ) => (
    <PdfDataTable
      source={tableSource}
      sampleRows={sampleRows}
      // Sin filas: el mensaje, si lo tiene; si no, la tabla no sale.
      emptyRows={empty ? "message" : "hide"}
      {...(empty && { emptyRowsText: empty })}
      groupBy={grouping.groupBy ?? ""}
      showGroupFooter={Boolean(grouping.footer)}
      startGroupFooter={grouping.footer}
      hideEmptyColumns={grouping.hideEmptyColumns ?? "none"}
      // El título de la sección, en la Tabla: si sigue en otra página, sale
      // otra vez con «(continuación)», como hoy.
      showTitle
      titleRepeat="continued"
      startTitle={sectionTitleBox(index ? 4 : 0)}
      startTitleText={sectionTitleText(sectionTitle)}
      startHeader={{
        alignY: "center",
        heightMode: "fixed",
        heightMm: 6.5,
        gapMm: 0,
        padding: sides({ left: 0 }),
        margin: sides({ bottom: 1 }),
        background: BAND,
        borderWidth: sides({}),
      }}
      startHeaderCell={{
        fontSizePt: 7,
        fontWeight: 700,
        color: SOFT,
        textCase: "upper",
        padding: sides({ left: 2, right: 2 }),
      }}
      startRow={{
        gapMm: 0,
        padding: sides({ top: 0.6, bottom: 1.8 }),
        borderColor: LINE,
        borderWidth: sides({ bottom: 0.1 }),
      }}
      startCell={{
        fontSizePt: 8,
        color: INK,
        padding: sides({ left: 2, right: 2 }),
      }}
    />
  );

  /** Un dato del documento (fecha de generación, número de página). */
  const documentText = (
    key: "page" | "date",
    format: string,
    props: Partial<PdfTextProps> = {},
  ) =>
    text("", {
      valueSource: DOCUMENT_SOURCE,
      valueKey: key,
      valueFormat: format,
      fontSizePt: 6.5,
      color: SOFT,
      ...props,
    });

  /** Un dato de ficha; se oculta si no llega. */
  const field = ({ label, key, today }: SheetField) => {
    const valueProps: Partial<PdfTextProps> = {
      fontSizePt: 8.5,
      fontWeight: 700,
      color: INK,
      widthMode: "fill",
      heightMode: "fixed",
      heightMm: 3.6,
      overflowMode: "clip",
    };
    return box(
      {
        direction: "column",
        gapMm: 0.6,
        ...(!today && hideIfEmpty(key, source)),
      },
      [
        text(label, {
          fontSizePt: 6.5,
          color: SOFT,
          textCase: "upper",
        }),
        today
          ? documentText("date", "short", valueProps)
          : data(key, valueProps),
      ],
    );
  };

  /** Varias columnas de datos, cada una de arriba abajo. */
  const fields = (columns: SheetField[][], props: Partial<PdfContainerProps>) =>
    box({ direction: "row", gapMm: 0, ...props }, [
      ...columns.map((column) =>
        box(
          { direction: "column", gapMm: 1.8, padding: sides({ left: 2 }) },
          column.map(field),
        ),
      ),
    ]);

  /** El título de una ficha o sección: mayúsculas y una línea debajo. */
  const title = (value: ReactNode, props: Partial<PdfContainerProps> = {}) =>
    box(
      {
        direction: "row",
        heightMode: "fixed",
        heightMm: 4.6,
        margin: sides({ bottom: 1.8 }),
        borderColor: LINE,
        borderWidth: sides({ bottom: 0.3 }),
        ...props,
      },
      [value],
    );

  const titleText = (value: string) =>
    text(value, {
      fontSizePt: 8.5,
      fontWeight: 700,
      color: INK,
      textCase: "upper",
    });

  /** Una ficha: su título y sus datos en dos columnas. */
  const card = (config: SheetConfig["general"]) =>
    box({ direction: "column" }, [
      title(titleText(config.title)),
      fields(config.columns, {}),
    ]);

  return (
    <Element is={PdfContainer} canvas {...page} pageFooter>
      {/* La empresa a la izquierda y el título a la derecha. */}
      {box(
        {
          direction: "row",
          padding: sides({ bottom: 3 }),
          margin: sides({ bottom: 5 }),
          borderColor: LINE,
          borderWidth: sides({ bottom: 0.4 }),
        },
        [
          box({ direction: "column", gapMm: 0.6 }, [
            setting("CompanyName", {
              fontSizePt: 12,
              fontWeight: 700,
              color: INK,
              margin: sides({ bottom: 0.8 }),
            }),
            box(
              {
                direction: "row",
                ...hideIfEmpty("CompanyDocumentNumber", "business"),
              },
              [
                text("RUC ", { fontSizePt: 7.5, color: SOFT }),
                setting("CompanyDocumentNumber", {
                  fontSizePt: 7.5,
                  color: SOFT,
                }),
              ],
            ),
            box(
              {
                direction: "row",
                ...hideIfEmpty("BranchAddress", "business"),
              },
              [
                setting("BranchAddress", {
                  fontSizePt: 7.5,
                  color: SOFT,
                  widthMode: "fill",
                }),
              ],
            ),
            box(
              {
                direction: "row",
                ...hideIfEmpty("CompanyPhoneNumber", "business"),
              },
              [
                setting("CompanyPhoneNumber", {
                  fontSizePt: 7.5,
                  color: SOFT,
                }),
              ],
            ),
          ]),
          sheet.titleKey
            ? data(sheet.titleKey, {
                fontSizePt: 17,
                fontWeight: 700,
                align: "right",
                textCase: "upper",
                emptyText: sheet.title,
              })
            : text(sheet.title, {
                fontSizePt: 17,
                fontWeight: 700,
                color: INK,
                align: "right",
              }),
        ],
      )}

      {/* La banda de identificación. */}
      {fields(sheet.identification, {
        padding: sides({ top: 1.5, bottom: 1.5 }),
        margin: sides({ bottom: 2 }),
        background: BAND,
      })}

      {/* Las dos fichas, lado a lado (si el documento las lleva). */}
      {sheet.general &&
        box({ direction: "row", gapMm: 8, margin: sides({ bottom: 4 }) }, [
          card(sheet.general),
          sheet.technical ? card(sheet.technical) : box({}, null),
        ])}

      {/* Las fotos de referencia, si el documento las lleva. */}
      {/* Su título va en la Tabla: sin fotos, no sale ninguno de los dos. */}
      {sheet.images && (
        <PdfDataTable
          source={sheet.images.source}
          sampleRows={sheet.images.sampleRows}
          emptyRows="hide"
          showTitle
          titleRepeat="none"
          startTitle={sectionTitleBox(0)}
          startTitleText={sectionTitleText(sheet.images.title)}
          showHeader={false}
          rowsDirection="row"
          rowGapMm={3}
          margin={sides({ bottom: 4 })}
          startRow={{ gapMm: 0, padding: sides({}) }}
          startCell={{
            borderColor: LINE,
            borderWidth: sides({
              top: 0.2,
              right: 0.2,
              bottom: 0.2,
              left: 0.2,
            }),
          }}
        />
      )}

      {/* Las secciones: su título y su tabla (el encabezado gris, repetido
          en cada página) y, si tiene, su total al pie. */}
      {box(
        { direction: "column" },
        [
          {
            title: sheet.sectionTitle,
            source: sheet.sectionSource ?? source,
            sampleRows: sheet.sampleRows,
            subtotal: sheet.sectionSubtotal,
            empty: sheet.sectionEmpty,
            grouping: {
              groupBy: sheet.sectionGroupBy,
              hideEmptyColumns: sheet.hideEmptyColumns,
              footer: sheet.sectionGroupFooter,
            },
          },
          ...(sheet.moreSections ?? []),
        ].flatMap((section, index) => [
          table(
            section.source,
            section.sampleRows,
            section.title,
            index,
            "grouping" in section ? section.grouping : {},
            section.empty,
          ),
          ...(section.subtotal
            ? [
                box(
                  {
                    direction: "row",
                    alignX: "end",
                    margin: sides({ top: 1 }),
                    ...hideIfEmpty(section.subtotal[1], source),
                  },
                  [
                    text(section.subtotal[0], {
                      fontSizePt: 7.5,
                      fontWeight: 700,
                      color: SOFT,
                      align: "right",
                      widthMode: "fixed",
                      widthMm: 34,
                    }),
                    data(section.subtotal[1], {
                      fontSizePt: 7.5,
                      fontWeight: 700,
                      align: "right",
                      widthMode: "fixed",
                      widthMm: 34,
                    }),
                  ],
                ),
              ]
            : []),
        ]),
      )}

      {/* Los totales, a la derecha; subtotal e IGV solo si alguna línea
          declara el IGV. */}
      {box(
        {
          direction: "column",
          alignX: "end",
          gapMm: 1.5,
          margin: sides({ top: 4, bottom: 3 }),
        },
        sheet.totals.map(([label, key, labelKey]) =>
          box(
            {
              direction: "row",
              widthMode: "hug",
              ...hideIfEmpty(key, source),
            },
            [
              // En mayúsculas, como hoy; el rótulo puede venir con la orden.
              (labelKey ? data : text)(labelKey ?? label, {
                fontSizePt: 8.5,
                fontWeight: 700,
                color: INK,
                align: "right",
                textCase: "upper",
                widthMode: "fixed",
                widthMm: 40,
                ...(labelKey && { emptyText: label }),
              }),
              data(key, {
                fontSizePt: 8.5,
                fontWeight: 700,
                align: "right",
                widthMode: "fixed",
                widthMm: 40,
              }),
            ],
          ),
        ),
      )}

      {/* Las observaciones, en su recuadro; sin ellas no sale. */}
      {box(
        {
          direction: "column",
          gapMm: 1.5,
          padding: sides({ top: 2.5, right: 3, bottom: 2.5, left: 3 }),
          background: BAND,
          borderColor: LINE,
          borderWidth: sides({ top: 0.3, right: 0.3, bottom: 0.3, left: 0.3 }),
          // Pasa entero a la página siguiente si no entra.
          keepTogether: true,
          // Sin condiciones fijas, sin el dato no sale.
          ...(!sheet.conditions?.length && hideIfEmpty("observations", source)),
        },
        [
          text("OBSERVACIONES", {
            fontSizePt: 7,
            fontWeight: 700,
            color: SOFT,
          }),
          box({ direction: "row", ...hideIfEmpty("observations", source) }, [
            data("observations", {
              fontSizePt: 8.5,
              fontWeight: 700,
              widthMode: "fill",
            }),
          ]),
          ...(sheet.conditions ?? []).map((condition) =>
            text(condition, {
              fontSizePt: 8.5,
              fontWeight: 700,
              color: INK,
              widthMode: "fill",
            }),
          ),
        ],
      )}

      {/* La nota al pie del documento, en pequeño, si tiene. */}
      {sheet.footnoteKey &&
        box(
          {
            direction: "row",
            margin: sides({ top: 1 }),
            ...hideIfEmpty(sheet.footnoteKey, source),
          },
          [
            data(sheet.footnoteKey, {
              fontSizePt: 6.5,
              color: SOFT,
              widthMode: "fill",
            }),
          ],
        )}

      {/* Las notas al pie fijas, en pequeño. */}
      {sheet.footnotes &&
        box(
          { direction: "column", gapMm: 0.6, margin: sides({ top: 1 }) },
          sheet.footnotes.map((note) =>
            text(note, { fontSizePt: 6.5, color: SOFT, widthMode: "fill" }),
          ),
        )}

      {/* En cada página: la línea y la fecha de generación. */}
      <Element is={PdfContainer} canvas {...pageZoneProps("footer")}>
        {box(
          {
            direction: "row",
            margin: sides({ top: 4 }),
            padding: sides({ top: 1.8 }),
            borderColor: LINE,
            borderWidth: sides({ top: 0.2 }),
          },
          [
            text("Generado el ", { fontSizePt: 6.5, color: SOFT }),
            documentText("date", "datetime2"),
            // La página de cada página, a la derecha.
            documentText("page", "page_of", {
              widthMode: "fill",
              align: "right",
            }),
          ],
        )}
      </Element>
    </Element>
  );
}

export const purchaseOrderDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "purchase_order");

export const serviceOrderDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "service_order");

export const customerServiceOrderDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "customer_service_order");

export const productionOrderDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "production_order");

export const materialRequirementDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "material_requirement");

export const recipeDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "recipe");

export const styleOperationsDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "style_operations");

export const bundleSheetDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "bundle_sheet");

export const workLogBatchDesign = (page: Partial<PdfContainerProps>) =>
  sheetDesign(page, "work_log_batch");
