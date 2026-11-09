import type { ReactElement, ReactNode } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfDataTable } from "../components/pdf-data-table";
import {
  amount,
  box,
  FOOTER_MESSAGE,
  hideIfEmpty,
  invoiceQr,
  logo,
  rule,
  setting,
  sides,
  text,
  value,
} from "./parts";
import { INVOICE_KINDS, type InvoiceKind } from "../../constants/invoiceKinds";

/**
 * El Comprobante A4 de hoy (renderInvoiceA4 en invoiceA4Pdf.ts), armado con
 * los componentes del editor: la cabecera con la empresa a la izquierda y el
 * recuadro del comprobante a la derecha, los datos, los ítems, los totales a
 * la derecha y el pie.
 *
 * Uno por tipo de comprobante (constants/invoiceKinds): su título, las filas
 * de la nota y la representación impresa de los electrónicos. Las filas que
 * dependen de los datos (el domicilio fiscal, el teléfono y el correo de la
 * empresa, el documento y la dirección del cliente, las operaciones
 * gratuitas) van en Contenedores con «Ocultar si está vacío».
 */

/** Los tamaños de letra del A4, en pt. */
const SIZE = {
  title: 11,
  normal: 8.5,
  small: 8,
  tiny: 7.5,
  total: 10,
  footer: 9,
};

/** Ancho del recuadro del comprobante y de los totales, en mm. */
const SIDE_BOX_MM = 70;

/** Ancho de las etiquetas de los datos del comprobante, en mm. */
const LABEL_MM = 36;

/**
 * Una línea de la empresa: lo escrito y el dato, juntos. La de un dato de la
 * configuración se oculta si está vacío (como hoy, que no sale).
 */
const companyLine = (label: string, key: string, fromSettings = true) =>
  box({ direction: "row", ...(fromSettings && hideIfEmpty(key, "business")) }, [
    text(label, { fontSizePt: SIZE.small }),
    (fromSettings ? setting : value)(key, {
      fontSizePt: SIZE.small,
      widthMode: "fill",
    }),
  ]);

/**
 * «ETIQUETA: dato», con la etiqueta de ancho fijo. Con `hideKey`, la fila se
 * oculta si ese dato está vacío.
 */
const field = (label: string, content: ReactNode, hideKey?: string) =>
  box({ direction: "row", ...(hideKey && hideIfEmpty(hideKey)) }, [
    text(label, {
      fontSizePt: SIZE.normal,
      fontWeight: 700,
      widthMode: "fixed",
      widthMm: LABEL_MM,
    }),
    content,
  ]);

/**
 * Una fila de totales: la etiqueta a la izquierda y el importe a la derecha,
 * con «S/» si es dinero.
 */
const total = (
  label: string,
  key: string,
  strong = false,
  money = true,
  optional = false,
) => {
  const props: Partial<PdfTextProps> = {
    fontSizePt: strong ? SIZE.total : SIZE.normal,
    fontWeight: strong ? 700 : 400,
  };
  return box({ direction: "row", ...(optional && hideIfEmpty(key)) }, [
    text(label, { ...props, widthMode: "fill" }),
    money ? amount(key, props) : value(key, { ...props, align: "right" }),
  ]);
};

export function invoiceA4Design(
  page: Partial<PdfContainerProps>,
  kind: InvoiceKind,
): ReactElement {
  const info = INVOICE_KINDS[kind];
  const boxTitle: Partial<PdfTextProps> = {
    fontSizePt: SIZE.title,
    fontWeight: 700,
    align: "center",
  };
  const centerText = (label: string, props: Partial<PdfTextProps>) =>
    text(label, { align: "center", widthMode: "fill", ...props });
  return (
    <Element is={PdfContainer} canvas {...page}>
      {/* Cabecera: la empresa a la izquierda, el comprobante a la derecha. */}
      {box({ direction: "row", gapMm: 6 }, [
        box({ direction: "column", gapMm: 0.5 }, [
          logo({ widthMm: 55, heightMm: 22, margin: sides({ bottom: 3 }) }),
          setting("CompanyName", {
            fontSizePt: SIZE.title,
            fontWeight: 700,
            textCase: "upper",
            widthMode: "fill",
            margin: sides({ bottom: 0.5 }),
            // Sin nombre, hoy se escribe «EMPRESA».
            emptyText: "EMPRESA",
          }),
          companyLine("Domicilio fiscal: ", "CompanyAddress"),
          companyLine("Establecimiento: ", "establishmentAddress", false),
          companyLine("Teléfono: ", "CompanyPhoneNumber"),
          companyLine("E-mail: ", "CompanyEmail"),
        ]),
        box(
          {
            direction: "column",
            alignX: "center",
            gapMm: 1.5,
            widthMode: "fixed",
            widthMm: SIDE_BOX_MM,
            padding: sides({ top: 3, right: 3, bottom: 3, left: 3 }),
            borderWidth: sides({
              top: 0.4,
              right: 0.4,
              bottom: 0.4,
              left: 0.4,
            }),
          },
          [
            box({ direction: "row", alignX: "center" }, [
              text("R.U.C. N° ", boxTitle),
              setting("CompanyDocumentNumber", boxTitle),
            ]),
            text(info.title, { ...boxTitle, widthMode: "fill" }),
            value("serieNumber", { ...boxTitle, widthMode: "fill" }),
          ],
        ),
      ])}
      {rule(0.3, 6, 5)}

      {/* Los datos del comprobante y del cliente. */}
      {box({ direction: "column", gapMm: 0.5 }, [
        field(
          "FECHA DE EMISIÓN:",
          value("issuedAt", { fontSizePt: SIZE.normal, widthMode: "fill" }),
        ),
        field(
          "MONEDA:",
          text("SOLES", { fontSizePt: SIZE.normal, widthMode: "fill" }),
        ),
        field(
          "PEDIDO:",
          box({ direction: "row" }, [
            text("#", { fontSizePt: SIZE.normal }),
            value("orderNumber", {
              fontSizePt: SIZE.normal,
              widthMode: "fill",
            }),
          ]),
        ),
        field(
          "CLIENTE:",
          value("customerName", {
            fontSizePt: SIZE.normal,
            widthMode: "fill",
            emptyText: "Clientes Varios",
          }),
        ),
        // El documento del cliente: «DNI: 45678912».
        box({ direction: "row", ...hideIfEmpty("customerDocument") }, [
          box(
            {
              direction: "row",
              widthMode: "fixed",
              widthMm: LABEL_MM,
            },
            [
              value("customerDocumentType", {
                fontSizePt: SIZE.normal,
                fontWeight: 700,
                emptyText: "Doc",
              }),
              text(":", { fontSizePt: SIZE.normal, fontWeight: 700 }),
            ],
          ),
          value("customerDocument", {
            fontSizePt: SIZE.normal,
            widthMode: "fill",
          }),
        ]),
        field(
          "DIRECCIÓN:",
          value("customerAddress", {
            fontSizePt: SIZE.normal,
            widthMode: "fill",
          }),
          "customerAddress",
        ),
        ...(info.note
          ? [
              field(
                "DOC. QUE MODIFICA:",
                value("modifiedDocument", {
                  fontSizePt: SIZE.normal,
                  widthMode: "fill",
                }),
                "modifiedDocument",
              ),
              field(
                "MOTIVO:",
                value("noteReason", {
                  fontSizePt: SIZE.normal,
                  widthMode: "fill",
                }),
                "noteReason",
              ),
            ]
          : []),
      ])}

      {/* Los ítems, con el envío y los descuentos del pedido. */}
      {/* Con las filas pares en gris claro, como las celdas del A4. */}
      <PdfDataTable
        source="invoice_items"
        sampleRows={7}
        stripeRows
        stripeOn="even"
        stripeColor="rgba(240, 240, 240, 1)"
        margin={sides({ top: 2 })}
      />
      {rule(0.3, 1, 4)}

      {/* Los totales, a la derecha. */}
      {box({ direction: "row", alignX: "end" }, [
        box(
          {
            direction: "column",
            gapMm: 0.8,
            widthMode: "fixed",
            widthMm: SIDE_BOX_MM,
          },
          [
            total("TOTAL CANT.", "totalQuantity", false, false),
            total("OP. GRAVADAS", "taxedAmount"),
            total("OP. EXONERADAS", "exemptAmount", false, true, true),
            total("IGV 18%", "igv"),
            total("OP. GRATUITAS", "freeAmount", false, true, true),
            total("IMPORTE TOTAL:", "totalAmount", true),
          ],
        ),
      ])}
      {box({ direction: "row", gapMm: 1, margin: sides({ top: 1.5 }) }, [
        text("SON:", { fontSizePt: SIZE.normal, fontWeight: 700 }),
        value("amountInWords", { fontSizePt: SIZE.normal, widthMode: "fill" }),
      ])}
      {box({ direction: "row", gapMm: 1, margin: sides({ top: 2 }) }, [
        text("CAJERO:", { fontSizePt: SIZE.normal, fontWeight: 700 }),
        value("cashier", {
          fontSizePt: SIZE.normal,
          textCase: "upper",
          widthMode: "fill",
        }),
      ])}
      {/* El QR y, a su lado, la leyenda de representación impresa. */}
      {/* Solo los electrónicos: el QR y la representación impresa. */}
      {info.electronic &&
        box(
          {
            direction: "row",
            alignY: "center",
            gapMm: 5,
            margin: sides({ top: 4 }),
          },
          [
            invoiceQr(30),
            text(`Representación impresa de la ${info.electronic}`, {
              fontSizePt: SIZE.small,
              widthMode: "fill",
            }),
          ],
        )}

      {/* El pie. */}
      {rule(0.3, 4, 5)}
      {centerText("CAMBIOS Y DEVOLUCIONES", {
        fontSizePt: SIZE.footer,
        fontWeight: 700,
        margin: sides({ bottom: 1 }),
      })}
      {value("footerMessage", {
        align: "center",
        widthMode: "fill",
        fontSizePt: SIZE.tiny,
        emptyText: FOOTER_MESSAGE,
      })}
      {/* Las leyendas de SUNAT, si las lleva. */}
      {box({ direction: "column", ...hideIfEmpty("legends") }, [
        value("legends", {
          align: "center",
          widthMode: "fill",
          fontSizePt: SIZE.tiny,
          margin: sides({ top: 2 }),
        }),
      ])}
      {centerText("Gracias por tu confianza.", {
        fontSizePt: SIZE.normal,
        fontWeight: 700,
        margin: sides({ top: 2 }),
      })}
    </Element>
  );
}
