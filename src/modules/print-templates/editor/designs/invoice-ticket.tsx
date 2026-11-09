import type { ReactElement, ReactNode } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfDataTable } from "../components/pdf-data-table";
import type { Sides } from "../lib/units";
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
 * El Comprobante ticket 80 mm de hoy (renderInvoiceTicket en
 * invoiceTicketPdf.ts), armado con los componentes del editor: los tamaños de
 * letra, el orden y las líneas del generador, con los datos de «Ítems del
 * comprobante» y, los de la empresa, de la sesión. Uno por tipo de
 * comprobante (constants/invoiceKinds): su título, las filas de la nota y la
 * representación impresa de los electrónicos.
 *
 * Las filas que dependen de los datos (el domicilio fiscal, el teléfono y el
 * correo de la empresa, el documento y la dirección del cliente, las
 * operaciones gratuitas) van en Contenedores con «Ocultar si está vacío».
 */

/** Los tamaños de letra del ticket, en pt. */
const SIZE = { title: 11, subtitle: 9.5, normal: 8.5, small: 8, tiny: 7.5 };

/**
 * Una línea centrada: lo escrito y el dato, juntos. Con `hide`, la línea se
 * oculta si ese dato está vacío.
 */
const centered = (
  children: ReactNode,
  margin: Partial<Sides> = {},
  hide: Partial<PdfContainerProps> = {},
) =>
  box(
    { direction: "row", alignX: "center", margin: sides(margin), ...hide },
    children,
  );

/**
 * «ETIQUETA: dato», a la izquierda. Con `optional`, la fila se oculta si el
 * dato está vacío.
 */
const field = (label: string, key: string, optional = false, emptyText = "") =>
  box({ direction: "row", gapMm: 1, ...(optional && hideIfEmpty(key)) }, [
    text(label, { fontSizePt: SIZE.normal, fontWeight: 700 }),
    value(key, { fontSizePt: SIZE.normal, widthMode: "fill", emptyText }),
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
    fontSizePt: strong ? SIZE.subtitle : SIZE.normal,
    fontWeight: strong ? 700 : 400,
  };
  return box({ direction: "row", ...(optional && hideIfEmpty(key)) }, [
    text(label, { ...props, widthMode: "fill" }),
    money ? amount(key, props) : value(key, { ...props, align: "right" }),
  ]);
};

export function invoiceTicketDesign(
  page: Partial<PdfContainerProps>,
  kind: InvoiceKind,
): ReactElement {
  const info = INVOICE_KINDS[kind];
  const center = { align: "center" as const, widthMode: "fill" as const };
  return (
    <Element is={PdfContainer} canvas {...page}>
      {/* La empresa. */}
      {box({ direction: "row", alignX: "center" }, [
        logo({ widthMm: 60, heightMm: 22, margin: sides({ bottom: 3 }) }),
      ])}
      {setting("CompanyName", {
        ...center,
        fontSizePt: SIZE.title,
        fontWeight: 700,
        textCase: "upper",
        margin: sides({ top: 2, bottom: 0.5 }),
        // Sin nombre, hoy se escribe «EMPRESA».
        emptyText: "EMPRESA",
      })}
      {centered(
        [
          text("Domicilio fiscal: ", { fontSizePt: SIZE.small }),
          setting("CompanyAddress", { fontSizePt: SIZE.small }),
        ],
        {},
        hideIfEmpty("CompanyAddress", "business"),
      )}
      {value("establishmentAddress", { ...center, fontSizePt: SIZE.small })}
      {centered(
        [
          text("Teléfono: ", { fontSizePt: SIZE.small }),
          setting("CompanyPhoneNumber", { fontSizePt: SIZE.small }),
        ],
        {},
        hideIfEmpty("CompanyPhoneNumber", "business"),
      )}
      {centered(
        [
          text("E-mail: ", { fontSizePt: SIZE.small }),
          setting("CompanyEmail", { fontSizePt: SIZE.small }),
        ],
        {},
        hideIfEmpty("CompanyEmail", "business"),
      )}
      {centered([
        text("R.U.C.: ", { fontSizePt: SIZE.small, fontWeight: 700 }),
        setting("CompanyDocumentNumber", {
          fontSizePt: SIZE.small,
          fontWeight: 700,
        }),
      ])}
      {rule(0.3, 1.5, 2.5)}

      {/* El comprobante. */}
      {text(info.title, {
        ...center,
        fontSizePt: SIZE.title,
        fontWeight: 700,
      })}
      {centered([
        text("PEDIDO: #", { fontSizePt: SIZE.title, fontWeight: 700 }),
        value("orderNumber", { fontSizePt: SIZE.title, fontWeight: 700 }),
      ])}
      {value("serieNumber", {
        ...center,
        fontSizePt: SIZE.subtitle,
        fontWeight: 700,
      })}
      {rule(0.2, 1, 2)}

      {/* El cliente. */}
      {box({ direction: "column", gapMm: 0.5 }, [
        field("FECHA DE EMISIÓN:", "issuedAt"),
        field("CLIENTE:", "customerName", false, "Clientes Varios"),
        // El documento del cliente: «DNI: 45678912».
        box(
          { direction: "row", gapMm: 1, ...hideIfEmpty("customerDocument") },
          [
            box({ direction: "row", widthMode: "hug" }, [
              value("customerDocumentType", {
                fontSizePt: SIZE.normal,
                fontWeight: 700,
                emptyText: "Doc",
              }),
              text(":", { fontSizePt: SIZE.normal, fontWeight: 700 }),
            ]),
            value("customerDocument", {
              fontSizePt: SIZE.normal,
              widthMode: "fill",
            }),
          ],
        ),
        field("DIRECCIÓN:", "customerAddress", true),
        ...(info.note
          ? [
              field("DOC. QUE MODIFICA:", "modifiedDocument", true),
              field("MOTIVO:", "noteReason", true),
            ]
          : []),
      ])}
      {rule(0.2, 1.5, 2)}

      {/* Los ítems, con el envío y los descuentos del pedido. */}
      <PdfDataTable source="invoice_items" sampleRows={7} />
      {rule(0.2, 1.5, 2)}

      {/* Los totales. */}
      {box({ direction: "column", gapMm: 0.5 }, [
        total("TOTAL CANT.", "totalQuantity", false, false),
        total("OP. GRAVADAS", "taxedAmount"),
        total("OP. EXONERADAS", "exemptAmount", false, true, true),
        total("IGV 18%", "igv"),
        total("OP. GRATUITAS", "freeAmount", false, true, true),
        total("IMPORTE TOTAL:", "totalAmount", true),
      ])}
      {box({ direction: "row", gapMm: 1, margin: sides({ top: 1 }) }, [
        text("SON:", { fontSizePt: SIZE.normal, fontWeight: 700 }),
        value("amountInWords", { fontSizePt: SIZE.normal, widthMode: "fill" }),
      ])}
      {box({ direction: "row", gapMm: 1, margin: sides({ top: 0.5 }) }, [
        text("CAJERO:", { fontSizePt: SIZE.normal, fontWeight: 700 }),
        value("cashier", {
          fontSizePt: SIZE.normal,
          textCase: "upper",
          widthMode: "fill",
        }),
      ])}
      {rule(0.3, 1.5, 3)}

      {/* El pie. */}
      {text("CAMBIOS Y DEVOLUCIONES", {
        ...center,
        fontSizePt: SIZE.subtitle,
        fontWeight: 700,
        margin: sides({ bottom: 0.5 }),
      })}
      {value("footerMessage", {
        ...center,
        fontSizePt: SIZE.tiny,
        emptyText: FOOTER_MESSAGE,
      })}
      {/* Las leyendas de SUNAT, si las lleva. */}
      {box({ direction: "column", ...hideIfEmpty("legends") }, [
        value("legends", {
          ...center,
          fontSizePt: SIZE.tiny,
          margin: sides({ top: 2 }),
        }),
      ])}
      {text("Gracias por tu confianza.", {
        ...center,
        fontSizePt: SIZE.normal,
        fontWeight: 700,
        margin: sides({ top: 2 }),
      })}
      {/* Solo los electrónicos: la representación impresa y el QR. */}
      {info.electronic &&
        text(`Representación impresa de la ${info.electronic}`, {
          ...center,
          fontSizePt: SIZE.tiny,
          margin: sides({ top: 2 }),
        })}
      {info.electronic &&
        box({ direction: "row", alignX: "center", margin: sides({ top: 1 }) }, [
          invoiceQr(35),
        ])}
    </Element>
  );
}
