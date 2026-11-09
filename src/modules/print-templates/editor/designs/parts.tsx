import { Children, type ReactNode } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import { PdfText, type PdfTextProps } from "../components/pdf-text";
import { PdfImage, type PdfImageProps } from "../components/pdf-image";
import { PdfQr, type PdfQrProps } from "../components/pdf-qr";
import { ZERO_SIDES, type Sides } from "../lib/units";
import type { HideOrigin } from "../lib/hide-rule";

/**
 * Las piezas con que se arman los diseños de las plantillas del sistema
 * (editor/designs): textos, datos, contenedores y líneas, transparentes y sin
 * margen interior, como los dibujan los generadores de PDF.
 */

export const CLEAR = "rgba(255, 255, 255, 0)";

/**
 * El mensaje del pie de los comprobantes: el que imprime hoy un tenant sin
 * InvoiceFooterMessage (DEFAULT_RETURN_POLICY en invoiceTicketPdf.ts). Se
 * cambia escribiéndolo.
 */
export const FOOTER_MESSAGE =
  "Recuerda que puedes realizar cambios y devoluciones dentro de los 15 días posteriores a la compra, siempre y cuando el producto esté en su estado original y con el ticket de compra.";

export const sides = (values: Partial<Sides>): Sides => ({
  ...ZERO_SIDES,
  ...values,
});

/** Un texto escrito, transparente. */
export const text = (value: string, props: Partial<PdfTextProps> = {}) => (
  <PdfText text={value} background={CLEAR} {...props} />
);

/** Un texto con un dato de la empresa (useAuth). */
export const setting = (key: string, props: Partial<PdfTextProps> = {}) => (
  <PdfText
    valueSource="business"
    valueKey={key}
    background={CLEAR}
    {...props}
  />
);

/** Un texto con un dato del comprobante. */
export const value = (key: string, props: Partial<PdfTextProps> = {}) => (
  <PdfText
    valueSource="invoice_items"
    valueKey={key}
    background={CLEAR}
    {...props}
  />
);

/** El logo del comprobante (Configuración > Negocio), entero en su caja. */
export const logo = (props: Partial<PdfImageProps>) => (
  <PdfImage imageKey="InvoiceLogoUrl" fit="contain" {...props} />
);

/** El QR del comprobante (el que pide SUNAT), cuadrado. */
export const invoiceQr = (sizeMm: number, props: Partial<PdfQrProps> = {}) => (
  <PdfQr
    valueSource="invoice_items"
    valueKey="qrCode"
    widthMm={sizeMm}
    heightMm={sizeMm}
    {...props}
  />
);

/**
 * Un importe con «S/» delante, escrito (la moneda no es un dato): el «S/» y
 * el importe, juntos, alineados a la derecha.
 */
export const amount = (key: string, props: Partial<PdfTextProps> = {}) =>
  box({ direction: "row", alignX: "end", widthMode: "hug" }, [
    text("S/ ", props),
    value(key, { ...props, align: "right" }),
  ]);

/**
 * Las props de «Ocultar si está vacío» de un Contenedor: se oculta si ese
 * dato del comprobante (o de la empresa, con `business`) está vacío o es cero.
 */
export const hideIfEmpty = (
  key: string,
  source: Exclude<HideOrigin, ""> = "invoice_items",
): Partial<PdfContainerProps> => ({
  hideWhenEmpty: true,
  hideSource: source,
  hideKey: key,
});

/** Un contenedor transparente, sin margen interior, del alto de lo que lleva. */
export const box = (props: Partial<PdfContainerProps>, children: ReactNode) => (
  <Element
    is={PdfContainer}
    canvas
    widthMode="fill"
    heightMode="hug"
    padding={ZERO_SIDES}
    background={CLEAR}
    {...props}
  >
    {/* Los hijos llegan en listas: con su key cada uno. */}
    {Children.toArray(children)}
  </Element>
);

/** Una línea de lado a lado, con aire arriba y abajo. */
export const rule = (widthMm: number, top: number, bottom: number) =>
  box(
    {
      margin: sides({ top, bottom }),
      borderWidth: sides({ bottom: widthMm }),
    },
    null,
  );
