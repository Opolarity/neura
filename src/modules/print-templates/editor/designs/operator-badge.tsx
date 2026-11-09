import type { ReactElement } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfBarcode } from "../components/pdf-barcode";
import { box, hideIfEmpty, sides, text } from "./parts";

/**
 * El Fotocheck de operario de hoy (drawCoupon en suppliers/utils/
 * workTicketsPdf.ts, con el cupón que arma OperatorsList): un cupón de
 * 93 × 38 con borde punteado para recortar. Arriba el nombre (9 pt, negrita)
 * y «Fotocheck» a la derecha; dos líneas de 7 pt (el área, o «Operario» si
 * no tiene, y el documento, que se oculta si no hay); el código de barras de 12 mm, siempre
 * a la misma altura, y el código debajo (8 pt, negrita).
 *
 * Como hoy, el nombre y las líneas quedan en una sola línea y se cortan al
 * final (sin «...»).
 */

const SOURCE = "operator_badge";

const data = (key: string, props: Partial<PdfTextProps> = {}) =>
  text("", { valueSource: SOURCE, valueKey: key, ...props });

/** El valor de una línea de 7 pt: lo que deja su rótulo del ancho (87 mm), cortado si no entra. */
const LINE: Partial<PdfTextProps> = {
  fontSizePt: 7,
  widthMode: "fixed",
  widthMm: 80,
  overflowMode: "clip",
};

/** El borde punteado del cupón: por donde se recorta. */
export const OPERATOR_BADGE_BORDER: Partial<PdfContainerProps> = {
  borderLineStyle: "dashed",
  borderColor: "rgb(150, 150, 150)",
  borderWidth: sides({ top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 }),
};

export function operatorBadgeDesign(
  page: Partial<PdfContainerProps>,
): ReactElement {
  return (
    <Element is={PdfContainer} canvas {...page} {...OPERATOR_BADGE_BORDER}>
      {/* Lo de arriba tiene alto fijo: el código de barras no se mueve aunque
          falte una línea. */}
      {box({ direction: "column", heightMode: "fixed", heightMm: 15 }, [
        box({ direction: "row", alignY: "end", gapMode: "auto" }, [
          data("fullName", {
            fontSizePt: 9,
            fontWeight: 700,
            widthMode: "fixed",
            widthMm: 59,
            overflowMode: "clip",
          }),
          text("Fotocheck", { fontSizePt: 9, fontWeight: 700 }),
        ]),
        // Sin área, hoy sale «Operario»: el rótulo se oculta.
        box({ direction: "row", margin: sides({ top: 1 }) }, [
          box(
            {
              direction: "row",
              widthMode: "hug",
              ...hideIfEmpty("area", SOURCE),
            },
            [text("Área: ", { fontSizePt: 7 })],
          ),
          data("area", { ...LINE, emptyText: "Operario" }),
        ]),
        box(
          {
            direction: "row",
            margin: sides({ top: 0.4 }),
            ...hideIfEmpty("documentNumber", SOURCE),
          },
          [
            data("documentType", { fontSizePt: 7, emptyText: "Doc." }),
            text(" ", { fontSizePt: 7 }),
            data("documentNumber", LINE),
          ],
        ),
      ])}
      <PdfBarcode
        valueSource={SOURCE}
        valueKey="code"
        widthMode="fill"
        heightMm={12}
      />
      {data("code", {
        fontSizePt: 8,
        fontWeight: 700,
        align: "center",
        widthMode: "fill",
        margin: sides({ top: 1 }),
      })}
    </Element>
  );
}
