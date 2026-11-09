/**
 * El diseño se guarda en unidades de papel: mm para medidas y pt para el
 * tamaño de letra. El lienzo las pinta con las mismas unidades CSS, así lo que
 * se ve en pantalla (al 100%) mide lo mismo que en la hoja.
 */

/** px CSS por mm (96 px por pulgada, 25,4 mm por pulgada). */
export const PX_PER_MM = 96 / 25.4;

export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const ZERO_SIDES: Sides = { top: 0, right: 0, bottom: 0, left: 0 };

/** Las cuatro esquinas, en mm (radio). */
export interface Corners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export const ZERO_CORNERS: Corners = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
};

export const mm = (value: number) => `${value}mm`;

/** px CSS a mm, redondeado a la décima: lo que se mide en el lienzo. */
export const pxToMm = (px: number) => Math.round((px / PX_PER_MM) * 10) / 10;

/** En el orden de border-radius: arriba-izquierda y en sentido horario. */
export const cornersToCss = ({
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
}: Corners) => `${topLeft}mm ${topRight}mm ${bottomRight}mm ${bottomLeft}mm`;

export const sidesToCss = ({ top, right, bottom, left }: Sides) =>
  `${top}mm ${right}mm ${bottom}mm ${left}mm`;
