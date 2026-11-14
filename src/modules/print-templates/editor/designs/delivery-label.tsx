import type { ReactElement } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { box, hideIfEmpty, logo, setting, sides, text } from "./parts";

/**
 * La Etiqueta de envío de hoy de 100 × 140 (template20607798002 en
 * sales/utils/deliveryLabelTemplates), armada con los componentes del editor:
 * un recuadro con la cabecera (logo | RUC), el remitente y el destinatario.
 * La empresa sale de la configuración y el destinatario de «Datos del envío».
 *
 * Lo escrito va en negrita y un poco espaciado, como los textos fijos del
 * generador; los datos, en negrita. Todo en negro y sin imágenes propias de
 * una marca: cada empresa pone su logo (Configuración > Negocio).
 */

/** El espacio entre letras de lo escrito (CHAR_SPACE = 0,35 mm), en pt. */
const SPACED = 1;

/** Lo escrito: negrita y espaciado. */
const label = (value: string, props: Partial<PdfTextProps> = {}) =>
  text(value, { fontWeight: 700, letterSpacingPt: SPACED, ...props });

/** Un dato de «Datos del envío», en negrita. */
const shipping = (key: string, props: Partial<PdfTextProps> = {}) =>
  text("", {
    valueSource: "delivery_label",
    valueKey: key,
    fontWeight: 700,
    ...props,
  });

/** «ETIQUETA: dato» en una línea, con la etiqueta en azul. */
const inline = (
  title: string,
  content: ReactElement,
  hide: Partial<PdfContainerProps> = {},
) =>
  box({ direction: "row", ...hide }, [
    label(title, { fontSizePt: 11 }),
    content,
  ]);

export function deliveryLabelDesign(
  page: Partial<PdfContainerProps>,
): ReactElement {
  const titleProps: Partial<PdfTextProps> = { fontSizePt: 17 };
  return (
    <Element is={PdfContainer} canvas {...page}>
      {/* El recuadro de la etiqueta, de lado a lado y de arriba abajo. */}
      {box(
        {
          direction: "column",
          heightMode: "fill",
          borderWidth: sides({ top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }),
        },
        [
          // Cabecera: el logo | el RUC.
          box(
            {
              direction: "row",
              heightMode: "fixed",
              heightMm: 18,
              borderWidth: sides({ bottom: 0.4 }),
            },
            [
              box(
                {
                  direction: "row",
                  alignX: "center",
                  alignY: "center",
                  widthMode: "fixed",
                  widthMm: 44,
                  heightMode: "fill",
                  borderWidth: sides({ right: 0.3 }),
                },
                [logo({ widthMm: 38, heightMm: 12 })],
              ),
              box(
                {
                  direction: "row",
                  alignY: "center",
                  heightMode: "fill",
                  padding: sides({ left: 3 }),
                },
                [
                  label("RUC: ", { fontSizePt: 12 }),
                  setting("CompanyDocumentNumber", {
                    fontSizePt: 12,
                    fontWeight: 700,
                    letterSpacingPt: SPACED,
                  }),
                ],
              ),
            ],
          ),
          // El remitente y el destinatario.
          box(
            {
              direction: "column",
              gapMm: 1.5,
              padding: sides({ top: 4, right: 2, left: 2 }),
            },
            [
              label("REMITENTE", {
                ...titleProps,
                margin: sides({ bottom: 2 }),
              }),
              setting("CompanyName", {
                fontSizePt: 11,
                fontWeight: 700,
                letterSpacingPt: SPACED,
                widthMode: "fill",
              }),
              inline(
                "CEL: ",
                setting("CompanyPhoneNumber", {
                  fontSizePt: 11,
                  fontWeight: 700,
                  letterSpacingPt: SPACED,
                }),
              ),
              label("DIRECCIÓN:", { fontSizePt: 11 }),
              shipping("senderAddress", {
                fontSizePt: 11,
                letterSpacingPt: SPACED,
                widthMode: "fill",
              }),
              label("DESTINATARIO", {
                ...titleProps,
                margin: sides({ top: 9, bottom: 2 }),
              }),
              shipping("recipientName", {
                fontSizePt: 11,
                textCase: "upper",
                widthMode: "fill",
              }),
              inline(
                "RUC/DNI: ",
                shipping("recipientDocument", { fontSizePt: 11 }),
                hideIfEmpty("recipientDocument", "delivery_label"),
              ),
              inline(
                "DESTINO: ",
                shipping("destination", { fontSizePt: 11, widthMode: "fill" }),
                hideIfEmpty("destination", "delivery_label"),
              ),
              inline(
                "CEL: ",
                box({ direction: "row", widthMode: "hug" }, [
                  text("+51 ", { fontSizePt: 11, fontWeight: 700 }),
                  shipping("recipientPhone", { fontSizePt: 11 }),
                ]),
                hideIfEmpty("recipientPhone", "delivery_label"),
              ),
            ],
          ),
          // Cobro al entregar y flete, en un recuadro que se vea de lejos.
          box(
            {
              direction: "column",
              alignX: "center",
              gapMm: 1,
              margin: sides({ top: 4, right: 2, left: 2 }),
              padding: sides({ top: 2, right: 2, bottom: 2, left: 2 }),
              borderWidth: sides({ top: 0.6, right: 0.6, bottom: 0.6, left: 0.6 }),
              ...hideIfEmpty("paymentNotice", "delivery_label"),
            },
            [
              shipping("paymentNotice", {
                fontSizePt: 14,
                align: "center",
                widthMode: "fill",
                letterSpacingPt: SPACED,
              }),
              shipping("freightNotice", {
                fontSizePt: 10,
                align: "center",
                widthMode: "fill",
                ...hideIfEmpty("freightNotice", "delivery_label"),
              }),
            ],
          ),
        ],
      )}
    </Element>
  );
}
