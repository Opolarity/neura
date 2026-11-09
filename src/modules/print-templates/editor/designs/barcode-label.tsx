import type { ReactElement } from "react";
import { Element } from "@craftjs/core";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import type { PdfTextProps } from "../components/pdf-text";
import { PdfBarcode } from "../components/pdf-barcode";
import { box, sides, text } from "./parts";

/**
 * La Etiqueta de código de barras de hoy (drawLabel en
 * barcodes/utils/generateBarcodePdf.ts), con su contenido por defecto: el
 * producto arriba (5 pt, negrita), el código de barras, el SKU con el lote
 * (4 pt) y el precio abajo (9 pt, negrita), todo centrado.
 *
 * Una mejora sobre la de hoy: el título tiene un alto fijo (dos líneas) y
 * achica su letra si es más largo, así no empuja el código de barras.
 */

const label = (key: string, props: Partial<PdfTextProps> = {}) =>
  text("", {
    valueSource: "barcode_label",
    valueKey: key,
    align: "center",
    widthMode: "fill",
    ...props,
  });

export function barcodeLabelDesign(
  page: Partial<PdfContainerProps>,
): ReactElement {
  return (
    <Element is={PdfContainer} canvas {...page} alignX="center">
      {label("title", {
        fontSizePt: 5,
        fontWeight: 700,
        lineHeight: 1.1,
        heightMode: "fixed",
        heightMm: 4,
        overflowMode: "shrink",
      })}
      {/* El código de barras: el ancho de la etiqueta menos 6 mm, 7 mm de
          alto, estirado. */}
      <PdfBarcode
        valueSource="barcode_label"
        valueKey="barcodeValue"
        widthMode="fill"
        heightMm={7}
        margin={sides({ top: 1, right: 1, left: 1 })}
      />
      {label("skuLot", { fontSizePt: 4, margin: sides({ top: 0.3 }) })}
      {/* El precio queda abajo: lo de en medio ocupa lo que sobra. */}
      {box({ heightMode: "fill" }, null)}
      {box({ direction: "row", alignX: "center" }, [
        text("S/.", { fontSizePt: 9, fontWeight: 700 }),
        label("price", { fontSizePt: 9, fontWeight: 700, widthMode: "hug" }),
      ])}
    </Element>
  );
}
