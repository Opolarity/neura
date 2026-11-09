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
 * Los Tickets de paquete de hoy (drawLabel en suppliers/utils/
 * bundleTicketsPdf.ts), pensados a 50 × 30: seis filas de rótulos pequeños
 * (5,5 pt) con su valor en negrita, la fila opcional de T.M, Tarifa y Monto
 * (cada uno se oculta si la empresa no lo usa: llega vacío) y abajo el código
 * de barras con su texto.
 *
 * Como hoy, lo que no cabe se corta con «...»: los valores de las filas de
 * dos campos, la operación y el texto del código de barras tienen ancho fijo
 * (el que les deja el generador a 50 × 30). Las filas de tres campos no se
 * cortan: hoy cada columna mide lo que ocupa su valor.
 */

const SOURCE = "bundle_ticket";

const data = (key: string, props: Partial<PdfTextProps> = {}) =>
  text("", {
    valueSource: SOURCE,
    valueKey: key,
    fontWeight: 700,
    ...props,
  });

/**
 * «Rótulo valor»: el rótulo pequeño y el valor en negrita, juntos. Sin dato,
 * el valor es «—», como hoy.
 */
const field = (
  label: string,
  key: string,
  sizePt: number,
  props: Partial<PdfTextProps> = {},
  boxProps: Partial<PdfContainerProps> = {},
) =>
  box(
    {
      direction: "row",
      alignY: "end",
      widthMode: "hug",
      gapMm: 0.8,
      ...boxProps,
    },
    [
      text(label, { fontSizePt: 5.5 }),
      data(key, { fontSizePt: sizePt, emptyText: "—", ...props }),
    ],
  );

/** Una fila: sus campos repartidos a lo ancho. */
const row = (children: ReactElement[]) =>
  box({ direction: "row", alignY: "end", gapMode: "auto" }, children);

const UPPER: Partial<PdfTextProps> = { textCase: "upper" };

/** El ancho de la hoja sin su margen interior, a 50 × 30. */
const CONTENT_MM = 47;

/** Un valor de ancho fijo que se corta con «...» si no cabe. */
const cut = (
  widthMm: number,
  props: Partial<PdfTextProps> = {},
): Partial<PdfTextProps> => ({
  widthMode: "fixed",
  widthMm,
  overflowMode: "ellipsis",
  ...props,
});

export function bundleTicketDesign(
  page: Partial<PdfContainerProps>,
): ReactElement {
  return (
    <Element is={PdfContainer} canvas {...page}>
      {row([
        field("Oper", "operCode", 9, cut(24)),
        field("Fec", "date", 6.5, cut(10.5, { align: "right" })),
      ])}
      {row([
        field("OP", "orderCode", 6.5),
        field("O/P", "customerOrderRef", 6.5),
        field("H.Cort", "cutCode", 6.5),
      ])}
      {row([
        field("Modelo", "model", 7, cut(19, UPPER)),
        field("Talla", "size", 7, cut(8, { ...UPPER, align: "right" })),
      ])}
      {row([
        field("Color", "color", 6.5, cut(20, UPPER)),
        field("Cant.", "quantity", 7.5, cut(8, { align: "right" })),
      ])}
      {row([
        field("Sec.", "sequence", 7),
        field("Pqte", "bundleNumber", 7),
        field("Rango", "range", 7),
      ])}
      {/* La operación, a todo el ancho y en una línea. */}
      {data("operation", {
        fontSizePt: 7,
        ...cut(CONTENT_MM, UPPER),
      })}
      {/* La fila opcional: cada dato se oculta si la empresa no lo usa. */}
      {row([
        field(
          "T.M",
          "standardMinutes",
          6.5,
          {},
          hideIfEmpty("standardMinutes", SOURCE),
        ),
        field("Tarifa", "pieceRate", 6.5, {}, hideIfEmpty("pieceRate", SOURCE)),
        box(
          {
            direction: "row",
            alignY: "end",
            widthMode: "hug",
            gapMm: 0.8,
            ...hideIfEmpty("amount", SOURCE),
          },
          [
            text("Monto", { fontSizePt: 5.5 }),
            text("S/", { fontSizePt: 6.5, fontWeight: 700 }),
            data("amount", { fontSizePt: 6.5 }),
          ],
        ),
      ])}
      {/* El código de barras ocupa lo que sobra; debajo, lo que codifica. */}
      <PdfBarcode
        valueSource={SOURCE}
        valueKey="barcode"
        widthMode="fill"
        heightMode="fill"
        margin={sides({ top: 0.6 })}
      />
      {data("barcode", {
        fontSizePt: 5.5,
        fontWeight: 400,
        ...cut(CONTENT_MM, { align: "center" }),
        margin: sides({ top: 0.3 }),
      })}
    </Element>
  );
}
