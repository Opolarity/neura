import type { ReactElement, ReactNode } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfDataTable } from "../components/pdf-data-table";
import { box, hideIfEmpty, logo, setting, sides, text } from "./parts";
import { pageZoneProps } from "../lib/page-zones";

/**
 * La Guía de remisión de venta de hoy (openRemisionGuidePdf en
 * shared/utils/remisionGuidePdf.ts, con la plantilla de documentos de la
 * venta): el recuadro con la empresa (logo y datos) y, a la derecha, el
 * título y el número sobre gris; las secciones Destinatario, Envío y
 * Transporte Público con su barra gris; el Detalle de Envío y el pie.
 *
 * Cada dato va con su rótulo en gris (7,5 pt, negrita) y, si llega vacío,
 * se escribe «-», como hoy. El teléfono y el correo de la empresa salen si
 * hay dato y su interruptor de la guía está encendido (Configuración); el
 * sitio web y el pie, si hay. Conductor, vehículo y peso bruto salen vacíos a
 * propósito: se llenan a mano.
 *
 * Desde la segunda página lleva el encabezado de página de hoy (lib/
 * page-zones): «GUÍA DE REMISIÓN T001-… — Detalle de Envío (cont.)».
 *
 * El encabezado del Detalle de Envío es el de la Tabla, coloreado como la
 * barra gris de hoy y repetido en cada página; las columnas caen donde hoy
 * (#, Descripción a 14 mm, Unidad a 120 y Cantidad a 155) y la descripción se
 * corta con «...».
 */

type GuideSource =
  | "remision_guide"
  | "transfer_guide"
  | "production_guide"
  | "intake_guide"
  | "material_guide";

const DARK = "rgba(20, 20, 20, 1)";
const MUTED = "rgba(90, 90, 90, 1)";
const GRAY_FILL = "rgba(240, 240, 240, 1)";
const GRAY_LINE = "rgba(180, 180, 180, 1)";
const SIZE = 7.5;

/** Un borde de 0,3 mm en gris en los lados que se pidan. */
const line = (
  on: Partial<Record<"top" | "right" | "bottom" | "left", boolean>>,
) =>
  ({
    borderColor: GRAY_LINE,
    borderWidth: sides({
      top: on.top ? 0.3 : 0,
      right: on.right ? 0.3 : 0,
      bottom: on.bottom ? 0.3 : 0,
      left: on.left ? 0.3 : 0,
    }),
  }) satisfies Partial<PdfContainerProps>;

const ALL = { top: true, right: true, bottom: true, left: true };

const dataOf = (
  source: GuideSource,
  key: string,
  props: Partial<PdfTextProps> = {},
) =>
  text("", {
    valueSource: source,
    valueKey: key,
    fontSizePt: SIZE,
    color: DARK,
    emptyText: "-",
    ...props,
  });

const label = (value: string, widthMm: number) =>
  text(value, {
    fontSizePt: SIZE,
    fontWeight: 700,
    color: MUTED,
    widthMode: "fixed",
    widthMm,
  });

/** «Rótulo: dato», con el rótulo del ancho de hoy. */
const labelValue = (title: string, labelMm: number, content: ReactNode) =>
  box({ direction: "row" }, [label(`${title}:`, labelMm), content]);

/** La barra gris con el nombre de una sección. */
const section = (title: string, top = 4) =>
  box(
    {
      direction: "row",
      alignY: "center",
      heightMode: "fixed",
      heightMm: 7,
      padding: sides({ left: 3 }),
      margin: sides({ top, bottom: 1.5 }),
      background: GRAY_FILL,
      ...line(ALL),
    },
    [text(title, { fontSizePt: 8.5, fontWeight: 700, color: DARK })],
  );

/** Lo de una sección: 3 mm a la izquierda, una fila debajo de otra. */
const rows = (children: ReactNode[]) =>
  box(
    { direction: "column", gapMm: 2.2, padding: sides({ left: 3 }) },
    children,
  );

/** Dos datos en una fila: el segundo empieza a la mitad de la hoja. */
const pair = (left: ReactNode, right: ReactNode) =>
  box({ direction: "row" }, [
    box({ direction: "row", widthMode: "fixed", widthMm: 88 }, [left]),
    box({ direction: "row" }, [right]),
  ]);

/**
 * Un dato de la empresa que sale solo si su interruptor de la guía está
 * encendido y hay dato: dos Contenedores, uno por cada condición.
 */
const shownIf = (switchKey: string, key: string, children: ReactNode[]) =>
  box(
    {
      direction: "row",
      widthMode: "hug",
      ...hideIfEmpty(switchKey, "business"),
    },
    [
      box(
        { direction: "row", widthMode: "hug", ...hideIfEmpty(key, "business") },
        children,
      ),
    ],
  );

/** Una línea de la empresa: gris, 7,5 pt. */
const companyText = (props: Partial<PdfTextProps>) => ({
  fontSizePt: SIZE,
  color: MUTED,
  ...props,
});

/**
 * La sección propia de cada guía, si tiene: sus datos como [rótulo, dato, lo
 * que se escribe si no llega]; sin eso último, el dato se oculta.
 */
const EXTRA_SECTIONS: Partial<
  Record<GuideSource, { title: string; fields: [string, string, string?][] }>
> = {
  production_guide: {
    title: "Servicio",
    fields: [
      ["Orden de producción", "orderCode"],
      ["Proceso destino", "processName"],
      ["Servicio", "service"],
      ["Lo realiza", "serviceSupplier"],
      // Sin origen, hoy sale «Almacén».
      ["Viene de", "comesFrom", "Almacén"],
      ["Fecha de envío", "sentDate"],
    ],
  },
  material_guide: {
    title: "Envío de material",
    fields: [
      ["Orden de producción", "orderCode"],
      ["Cotización", "quotation"],
      ["Servicio", "service"],
      ["Lo realiza", "serviceSupplier"],
      ["Almacén de destino", "destinationWarehouse"],
      ["Sale de", "originWarehouse"],
      ["Despachado por", "dispatchedBy"],
      ["Fecha de envío", "sentDate"],
    ],
  },
};

/**
 * La guía de venta, la de traslado o la de producción: el mismo papel. Las
 * dos últimas (sin la plantilla de documentos de hoy) no llevan logo ni pie y
 * escriben siempre el correo, el teléfono y el sitio web de la empresa. En la
 * de traslado el destinatario es la propia empresa con su RUC; la de
 * producción suma la sección «Servicio» entre Envío y Transporte. La de
 * ingreso es la de traslado con otro título: «GUÍA DE INGRESO». La de envío
 * de material es la de producción con la sección «Envío de material».
 */
function guideDesign(
  page: Partial<PdfContainerProps>,
  source: GuideSource,
): ReactElement {
  // Sin la plantilla de documentos: sin logo ni pie, la empresa entera.
  const plain = source !== "remision_guide";
  // El destinatario es la propia empresa (traslado e ingreso).
  const transfer = source === "transfer_guide" || source === "intake_guide";
  // La sección propia del envío, entre Envío y Transporte.
  const extra = EXTRA_SECTIONS[source];
  const data = (key: string, props: Partial<PdfTextProps> = {}) =>
    dataOf(source, key, props);
  /**
   * Un dato de «Servicio»: rótulo de 40 mm y el valor en lo que queda de su
   * mitad, en varias líneas si hace falta; se oculta si no llega.
   */
  const serviceField = (title: string, key: string, emptyText = "") =>
    box(
      {
        direction: "row",
        // La mitad de la hoja: dos por fila.
        widthMode: "fixed",
        widthMm: 88,
        ...(!emptyText && hideIfEmpty(key, source)),
      },
      [
        label(`${title}:`, 40),
        data(key, { widthMode: "fixed", widthMm: 45, emptyText }),
      ],
    );
  /** Una línea de la empresa: sin la plantilla de documentos, siempre. */
  const companyLine = (
    switchKey: string,
    key: string,
    children: ReactNode[],
  ) =>
    plain
      ? box({ direction: "row", widthMode: "hug" }, children)
      : shownIf(switchKey, key, children);
  return (
    // Desde la segunda página, el encabezado de página de hoy: «GUÍA DE
    // REMISIÓN T001-… — Detalle de Envío (cont.)» con su línea.
    <Element
      is={PdfContainer}
      canvas
      {...page}
      pageHeader
      headerPages={{ mode: "from", from: 2, to: 2 }}
    >
      <Element is={PdfContainer} canvas {...pageZoneProps("header")}>
        {box(
          {
            direction: "row",
            alignY: "center",
            heightMode: "fixed",
            heightMm: 7,
            margin: sides({ bottom: 5 }),
            ...line({ bottom: true }),
          },
          [
            text("GUÍA DE REMISIÓN ", {
              fontSizePt: 8,
              fontWeight: 700,
              color: DARK,
            }),
            data("guideNumber", { fontSizePt: 8, fontWeight: 700 }),
            text(" — Detalle de Envío (cont.)", {
              fontSizePt: 8,
              fontWeight: 700,
              color: DARK,
            }),
          ],
        )}
      </Element>
      {/* El recuadro de arriba: la empresa y, a la derecha, la guía. */}
      {box(
        { direction: "row", heightMode: "fixed", heightMm: 34, ...line(ALL) },
        [
          box(
            {
              direction: "row",
              gapMm: 4,
              heightMode: "fill",
              padding: sides({ top: 3, right: 3, bottom: 3, left: 3 }),
            },
            [
              ...(plain ? [] : [logo({ widthMm: 30, heightMm: 28 })]),
              box({ direction: "column", gapMm: 2.6 }, [
                setting("CompanyName", {
                  fontSizePt: 11,
                  fontWeight: 700,
                  color: DARK,
                  widthMode: "fill",
                }),
                setting("CompanyAddress", companyText({ widthMode: "fill" })),
                box({ direction: "row" }, [
                  companyLine("RemisionGuideShowEmail", "CompanyEmail", [
                    text("Email: ", companyText({})),
                    setting("CompanyEmail", companyText({})),
                    text("   ", companyText({})),
                  ]),
                  text("R.U.C. ", companyText({})),
                  setting("CompanyDocumentNumber", companyText({})),
                ]),
                companyLine("RemisionGuideShowPhone", "CompanyPhoneNumber", [
                  text("Teléfono: ", companyText({})),
                  setting("CompanyPhoneNumber", companyText({})),
                ]),
                box(
                  {
                    direction: "row",
                    ...(!plain && hideIfEmpty("CompanyWebsite", "business")),
                  },
                  [
                    text("Website: ", companyText({})),
                    setting("CompanyWebsite", companyText({})),
                  ],
                ),
              ]),
            ],
          ),
          box(
            {
              direction: "column",
              alignX: "center",
              widthMode: "fixed",
              widthMm: 62,
              heightMode: "fill",
              padding: sides({ top: 7 }),
              gapMm: 4.5,
              background: GRAY_FILL,
              ...line({ left: true }),
            },
            [
              text(
                source === "intake_guide"
                  ? "GUÍA DE INGRESO"
                  : "GUÍA DE REMISIÓN",
                {
                  fontSizePt: 10,
                  fontWeight: 700,
                  color: DARK,
                },
              ),
              data("guideNumber", { fontSizePt: 9, fontWeight: 700 }),
            ],
          ),
        ],
      )}

      {section("Destinatario", 5)}
      {rows([
        labelValue(
          "Destinatario",
          24,
          // En un traslado, la propia empresa.
          transfer
            ? setting("CompanyName", {
                fontSizePt: SIZE,
                color: DARK,
                textCase: "upper",
                emptyText: "-",
              })
            : data("recipientName", { textCase: "upper" }),
        ),
        labelValue(
          "Dirección principal",
          39,
          data("destinationAddress", { textCase: "upper", widthMode: "fill" }),
        ),
        labelValue(
          "Tipo Documento Identidad",
          50,
          transfer
            ? text("RUC", { fontSizePt: SIZE, color: DARK })
            : data("documentType", { textCase: "upper" }),
        ),
        labelValue(
          "Número de Documento de Identidad",
          64,
          transfer
            ? setting("CompanyDocumentNumber", {
                fontSizePt: SIZE,
                color: DARK,
                emptyText: "-",
              })
            : data("documentNumber"),
        ),
      ])}

      {section("Envío")}
      {rows([
        pair(
          labelValue("Fecha de emisión", 38, data("issueDate")),
          labelValue("Motivo de Traslado", 36, data("transferReason")),
        ),
        pair(
          labelValue("Fecha inicio de traslado", 50, data("issueDate")),
          labelValue(
            "Modalidad de Transporte",
            42,
            text("Transporte Público", { fontSizePt: SIZE, color: DARK }),
          ),
        ),
        pair(
          labelValue(
            "Dirección de partida",
            38,
            data("originAddress", { textCase: "upper", widthMode: "fill" }),
          ),
          labelValue(
            "Peso bruto total(KGM)",
            42,
            text("0.0", { fontSizePt: SIZE, color: DARK }),
          ),
        ),
        pair(
          labelValue(
            "Dirección de llegada",
            38,
            data("destinationAddress", {
              textCase: "upper",
              widthMode: "fill",
            }),
          ),
          // Solo cuando quien entrega no es la empresa (producción).
          box({ direction: "row", ...hideIfEmpty("originName", source) }, [
            label("Entregado por:", 42),
            data("originName", { textCase: "upper" }),
          ]),
        ),
      ])}

      {/* Producción y envío de material: qué trabajo es y de dónde viene,
          de dos en dos. Cada dato se oculta si no llega y los siguientes se
          corren, como hoy («Pasar a otra fila»). */}
      {extra && section(extra.title)}
      {extra &&
        box(
          {
            direction: "row",
            wrap: true,
            gapMm: 2.2,
            padding: sides({ left: 3 }),
          },
          extra.fields.map(([title, key, emptyText]) =>
            serviceField(title, key, emptyText),
          ),
        )}

      {section("Transporte Público")}
      {rows([
        pair(
          labelValue(
            "Empresa de Transporte",
            40,
            data("carrierName", { textCase: "upper" }),
          ),
          labelValue(
            "Conductor",
            22,
            text("-", { fontSizePt: SIZE, color: DARK }),
          ),
        ),
        labelValue(
          "Vehículo público",
          36,
          text("-", { fontSizePt: SIZE, color: DARK }),
        ),
      ])}

      {section("Detalle de Envío")}
      <PdfDataTable
        source={source}
        sampleRows={40}
        stripeRows
        stripeOn="even"
        stripeColor="rgba(248, 248, 248, 1)"
        {...line({ bottom: true })}
        // El encabezado de hoy: la barra gris de 7 mm, con borde; se repite
        // en cada página (debajo del «(cont.)»). Filas de 7 mm.
        startHeader={{
          alignY: "center",
          heightMode: "fixed",
          heightMm: 7,
          padding: sides({ left: 4 }),
          margin: sides({ bottom: 1 }),
          background: "rgba(220, 220, 220, 1)",
          ...line(ALL),
        }}
        startHeaderCell={{ fontSizePt: SIZE, fontWeight: 700, color: DARK }}
        startRow={{ padding: sides({ top: 1.9, bottom: 1.9, left: 4 }) }}
        startCell={{ fontSizePt: SIZE, color: DARK }}
      />
      {/* El pie de la guía de venta (Configuración), si hay. */}
      {!plain &&
        box(
          {
            direction: "row",
            margin: sides({ top: 3 }),
            ...hideIfEmpty("RemisionGuideFooterMessage", "business"),
          },
          [
            setting(
              "RemisionGuideFooterMessage",
              companyText({ widthMode: "fill" }),
            ),
          ],
        )}
    </Element>
  );
}

export const remisionGuideDesign = (page: Partial<PdfContainerProps>) =>
  guideDesign(page, "remision_guide");

export const transferGuideDesign = (page: Partial<PdfContainerProps>) =>
  guideDesign(page, "transfer_guide");

export const productionGuideDesign = (page: Partial<PdfContainerProps>) =>
  guideDesign(page, "production_guide");

export const intakeGuideDesign = (page: Partial<PdfContainerProps>) =>
  guideDesign(page, "intake_guide");

export const materialGuideDesign = (page: Partial<PdfContainerProps>) =>
  guideDesign(page, "material_guide");
