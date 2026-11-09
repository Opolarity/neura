import type { ReactElement } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { box, hideIfEmpty, logo, setting, sides, text } from "./parts";

/**
 * La Etiqueta de envío de hoy de 70 × 50 apaisada (template20611215895 en
 * sales/utils/deliveryLabelTemplates, la del rollo de 4"): todo centrado, el
 * nombre corto y el RUC arriba, el logo y los datos del destinatario.
 *
 * Hoy la letra se achica sola hasta que todo entra; aquí el destinatario y
 * la dirección tienen un alto fijo con «Ajuste del texto: Achicar la letra».
 */

/** Tamaño de letra de la etiqueta (BASE_FONT), en pt. */
const FONT = 7.5;

const centered: Partial<PdfTextProps> = {
  fontSizePt: FONT,
  align: "center",
  widthMode: "fill",
};

/** Un dato de «Datos del envío». */
const shipping = (key: string, props: Partial<PdfTextProps> = {}) =>
  text("", { valueSource: "delivery_label", valueKey: key, ...props });

/** Una línea centrada: «ETIQUETA dato», juntos. */
const line = (label: string, key: string) =>
  box({ direction: "row", alignX: "center" }, [
    text(label, { fontSizePt: FONT }),
    shipping(key, { fontSizePt: FONT, emptyText: "—" }),
  ]);

export function deliveryLabelSmallDesign(
  page: Partial<PdfContainerProps>,
): ReactElement {
  return (
    <Element
      is={PdfContainer}
      canvas
      {...page}
      // Margen de 3 mm y todo centrado en vertical, como hoy.
      padding={sides({ top: 3, right: 3, bottom: 3, left: 3 })}
      alignY="center"
      gapMm={0.5}
    >
      {box({ direction: "row", alignX: "center" }, [
        setting("CompanyShortName", { fontSizePt: FONT }),
        text(" - ", { fontSizePt: FONT }),
        setting("CompanyDocumentNumber", { fontSizePt: FONT }),
      ])}
      {box(
        {
          direction: "row",
          alignX: "center",
          margin: sides({ top: 2, bottom: 2 }),
        },
        [logo({ widthMm: 38, heightMm: 12 })],
      )}
      {line("RUC/DNI: ", "recipientDocument")}
      {shipping("recipientName", {
        ...centered,
        textCase: "upper",
        overflowMode: "shrink",
        heightMode: "fixed",
        heightMm: 3.5,
        emptyText: "—",
      })}
      {/* Sin celular, hoy sale «CEL: —»: el «+51» se oculta. */}
      {box({ direction: "row", alignX: "center" }, [
        text("CEL: ", { fontSizePt: FONT }),
        box(
          {
            direction: "row",
            widthMode: "hug",
            ...hideIfEmpty("recipientPhone", "delivery_label"),
          },
          [text("+51 ", { fontSizePt: FONT })],
        ),
        shipping("recipientPhone", { fontSizePt: FONT, emptyText: "—" }),
      ])}
      {box({ direction: "row", alignX: "center" }, [
        text("DIRECCIÓN: ", { fontSizePt: FONT }),
        shipping("destination", {
          fontSizePt: FONT,
          widthMode: "fill",
          overflowMode: "shrink",
          heightMode: "fixed",
          heightMm: 7,
          emptyText: "—",
        }),
      ])}
    </Element>
  );
}
