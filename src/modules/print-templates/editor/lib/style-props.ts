import type { CSSProperties } from "react";
import {
  cornersToCss,
  mm,
  sidesToCss,
  ZERO_CORNERS,
  ZERO_SIDES,
  type Corners,
  type Sides,
} from "./units";

/**
 * Propiedades que comparten varios componentes de la hoja. Cada grupo tiene su
 * tipo, sus valores por defecto, su estilo y su sección del panel
 * (components/property-sections): un componente nuevo las suma sin repetirlas.
 */

// --- Espaciado -------------------------------------------------------------

export interface SpacingProps {
  /** Margen interior. */
  padding: Sides;
  /** Margen exterior. */
  margin: Sides;
}

export const DEFAULT_SPACING: SpacingProps = {
  padding: ZERO_SIDES,
  margin: ZERO_SIDES,
};

export const spacingStyle = ({
  padding,
  margin,
}: SpacingProps): CSSProperties => ({
  padding: sidesToCss(padding),
  margin: sidesToCss(margin),
});

// --- Tamaño ----------------------------------------------------------------

/**
 * Cómo se decide cada medida: `fixed`, la escrita; `fill`, el espacio que le
 * deja su contenedor; `hug`, lo que ocupa su contenido.
 */
export type SizeMode = "fixed" | "fill" | "hug";

/** Cómo reparte un contenedor a sus hijos. */
export type FlexDirection = "column" | "row";

export interface SizeProps {
  widthMode: SizeMode;
  /** Solo se usa en `fixed`. */
  widthMm: number;
  heightMode: SizeMode;
  /** Solo se usa en `fixed`. */
  heightMm: number;
  /**
   * Relación de aspecto: con ella activa las dos medidas son fijas y cambiar
   * una cambia la otra, guardando `aspectRatio` (ancho ÷ alto).
   */
  aspectLocked: boolean;
  aspectRatio: number;
}

/** Relleno en los dos ejes; el Texto, por ejemplo, ajusta a su contenido. */
export const DEFAULT_SIZE: SizeProps = {
  widthMode: "fill",
  widthMm: 50,
  heightMode: "fill",
  heightMm: 20,
  aspectLocked: false,
  aspectRatio: 1,
};

/**
 * Una medida según su modo. En el eje en que el contenedor reparte (el
 * principal) rellenar es crecer con flex; en el otro, estirarse.
 */
const axisStyle = (
  dimension: "width" | "height",
  mode: SizeMode,
  valueMm: number,
  isMainAxis: boolean,
): CSSProperties => {
  const size = (value: string): CSSProperties =>
    dimension === "width" ? { width: value } : { height: value };
  switch (mode) {
    case "fixed":
      // En el eje principal una medida fija no se encoge.
      return { ...size(mm(valueMm)), ...(isMainAxis && { flexShrink: 0 }) };
    case "fill":
      return isMainAxis
        ? { ...size("auto"), flexGrow: 1, flexBasis: 0 }
        : { ...size("auto"), alignSelf: "stretch" };
    case "hug":
      return { ...size("fit-content"), ...(isMainAxis && { flexShrink: 0 }) };
  }
};

/**
 * Las dos medidas. Un componente libre (Posición) no está en el reparto de su
 * contenedor, así que no tiene espacio que rellenar: ahí rellenar ajusta a su
 * contenido.
 */
export const sizeStyle = (
  p: SizeProps,
  parentDirection: FlexDirection,
  free = false,
): CSSProperties => {
  const mode = (value: SizeMode) => (free && value === "fill" ? "hug" : value);
  return {
    ...axisStyle(
      "width",
      mode(p.widthMode),
      p.widthMm,
      !free && parentDirection === "row",
    ),
    ...axisStyle(
      "height",
      mode(p.heightMode),
      p.heightMm,
      !free && parentDirection === "column",
    ),
  };
};

// --- Posición --------------------------------------------------------------

export interface PositionProps {
  /** Libre: fuera del reparto de su contenedor, colocado en X e Y. */
  positionFree: boolean;
  /**
   * Dónde queda su esquina de arriba a la izquierda, en mm, contado desde el
   * interior de la Hoja (dentro de su borde). Solo se usan si es libre.
   */
  xMm: number;
  yMm: number;
}

export const DEFAULT_POSITION: PositionProps = {
  positionFree: false,
  xMm: 0,
  yMm: 0,
};

/** Un punto de la Hoja, en mm desde su interior. */
export interface PointMm {
  x: number;
  y: number;
}

/**
 * Un componente libre se coloca con absolute dentro del interior de su
 * ancestro libre más cercano o de la Hoja (`origin`, en coordenadas de la
 * Hoja); X e Y siempre se cuentan desde la Hoja. Va después del espaciado:
 * libre no lleva margen exterior.
 *
 * Todos llevan z-index 0, libres o no: así se pintan en el orden de la
 * Estructura (el de más abajo queda encima). Sin él, el navegador pinta los
 * absolute siempre por encima de los que están en el reparto. A un hijo de un
 * flex le basta el z-index, sin position, así no cambia contra qué se coloca
 * un libre.
 */
export const positionStyle = (
  p: PositionProps,
  origin: PointMm,
): CSSProperties =>
  p.positionFree
    ? {
        position: "absolute",
        left: mm(p.xMm - origin.x),
        top: mm(p.yMm - origin.y),
        margin: 0,
        zIndex: 0,
      }
    : { zIndex: 0 };

// --- Color -----------------------------------------------------------------

/** FFFFFF al 100 %: el fondo por defecto. */
export const WHITE = "rgba(255, 255, 255, 1)";

/** 000000 al 100 %: el borde y el texto por defecto. */
export const BLACK = "rgba(0, 0, 0, 1)";

// --- Apariencia ------------------------------------------------------------

export interface AppearanceProps {
  background: string;
}

export const DEFAULT_APPEARANCE: AppearanceProps = {
  background: WHITE,
};

export const appearanceStyle = (p: AppearanceProps): CSSProperties => ({
  background: p.background,
});

// --- Borde -----------------------------------------------------------------

/** Cómo es la línea del borde. */
export type BorderLineStyle = "solid" | "dashed" | "dotted" | "double";

export const BORDER_LINE_OPTIONS: { value: BorderLineStyle; label: string }[] =
  [
    { value: "solid", label: "Continua" },
    { value: "dashed", label: "Discontinua" },
    { value: "dotted", label: "Punteada" },
    { value: "double", label: "Doble" },
  ];

export interface BorderProps {
  borderLineStyle: BorderLineStyle;
  borderColor: string;
  /** Grosor de cada lado; 0 = ese lado sin borde. */
  borderWidth: Sides;
  /** Radio de cada esquina. */
  borderRadius: Corners;
}

export const DEFAULT_BORDER: BorderProps = {
  borderLineStyle: "solid",
  borderColor: BLACK,
  borderWidth: ZERO_SIDES,
  borderRadius: ZERO_CORNERS,
};

const hasWidth = ({ top, right, bottom, left }: Sides) =>
  top > 0 || right > 0 || bottom > 0 || left > 0;

export const borderStyle = (p: BorderProps): CSSProperties => ({
  // Sin grosor en ningún lado no se pinta borde.
  ...(hasWidth(p.borderWidth) && {
    borderStyle: p.borderLineStyle,
    borderColor: p.borderColor,
    borderWidth: sidesToCss(p.borderWidth),
  }),
  borderRadius: cornersToCss(p.borderRadius),
});

// --- Tipografía ------------------------------------------------------------

/** Los pesos de una fuente, de 100 (la más fina) a 900 (la más gruesa). */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const FONT_WEIGHT_NAMES: Record<FontWeight, string> = {
  100: "Fina",
  200: "Extrafina",
  300: "Ligera",
  400: "Normal",
  500: "Media",
  600: "Seminegrita",
  700: "Negrita",
  800: "Extranegrita",
  900: "Negra",
};

/**
 * Las tipografías del proyecto, con los pesos que tiene cada una. Las tres
 * primeras las trae jsPDF, solo en normal y negrita; las de Google (las del
 * editor del ecommerce) se cargan en print-template-editor.css con el rango de
 * pesos que se lista aquí y, para imprimir, habrá que incrustar su TTF en el
 * PDF.
 */
export const FONT_FAMILIES: Record<
  FontFamily,
  { label: string; css: string; weights: readonly FontWeight[] }
> = {
  helvetica: {
    label: "Helvetica",
    css: "Helvetica, Arial, sans-serif",
    weights: [400, 700],
  },
  times: {
    label: "Times",
    css: '"Times New Roman", Times, serif',
    weights: [400, 700],
  },
  courier: {
    label: "Courier",
    css: '"Courier New", Courier, monospace',
    weights: [400, 700],
  },
  inter: {
    label: "Inter",
    css: '"Inter", sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  },
  "space-grotesk": {
    label: "Space Grotesk",
    css: '"Space Grotesk", sans-serif',
    weights: [300, 400, 500, 600, 700],
  },
  "bebas-neue": {
    label: "Bebas Neue",
    css: '"Bebas Neue", sans-serif',
    weights: [400],
  },
  "open-sans": {
    label: "Open Sans",
    css: '"Open Sans", sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
  },
};

export type FontFamily =
  | "helvetica"
  | "times"
  | "courier"
  | "inter"
  | "space-grotesk"
  | "bebas-neue"
  | "open-sans";

export const FONT_OPTIONS = (Object.keys(FONT_FAMILIES) as FontFamily[]).map(
  (value) => ({
    value,
    label: FONT_FAMILIES[value].label,
  }),
);

export type TextAlign = "left" | "center" | "right" | "justify";

/**
 * Cómo se ven las mayúsculas, sin cambiar lo escrito: tal cual, todo en
 * mayúsculas, todo en minúsculas, cada palabra con inicial mayúscula o
 * versalitas (mayúsculas pequeñas).
 */
export type TextCase = "none" | "upper" | "lower" | "capitalize" | "smallCaps";

export interface TypographyProps {
  fontFamily: FontFamily;
  /** Uno de los pesos de la fuente (FONT_FAMILIES). */
  fontWeight: FontWeight;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textCase: TextCase;
  fontSizePt: number;
  lineHeight: number;
  /** Espacio entre letras, en pt; negativo las junta. */
  letterSpacingPt: number;
  align: TextAlign;
  color: string;
}

export const DEFAULT_TYPOGRAPHY: TypographyProps = {
  fontFamily: "helvetica",
  fontWeight: 400,
  italic: false,
  underline: false,
  strikethrough: false,
  textCase: "none",
  fontSizePt: 10,
  lineHeight: 1.2,
  letterSpacingPt: 0,
  align: "left",
  color: BLACK,
};

const TEXT_TRANSFORM: Record<TextCase, CSSProperties["textTransform"]> = {
  none: "none",
  upper: "uppercase",
  lower: "lowercase",
  capitalize: "capitalize",
  smallCaps: "none",
};

export const typographyStyle = (p: TypographyProps): CSSProperties => ({
  fontFamily: (FONT_FAMILIES[p.fontFamily] ?? FONT_FAMILIES.helvetica).css,
  fontWeight: p.fontWeight,
  fontStyle: p.italic ? "italic" : "normal",
  textDecorationLine:
    [p.underline && "underline", p.strikethrough && "line-through"]
      .filter(Boolean)
      .join(" ") || "none",
  textTransform: TEXT_TRANSFORM[p.textCase],
  fontVariant: p.textCase === "smallCaps" ? "small-caps" : "normal",
  fontSize: `${p.fontSizePt}pt`,
  lineHeight: p.lineHeight,
  letterSpacing: `${p.letterSpacingPt}pt`,
  textAlign: p.align,
  color: p.color,
});

/**
 * El peso más cercano que tiene la fuente: al cambiar de fuente el peso
 * elegido puede no existir en la nueva.
 */
export const closestWeight = (family: FontFamily, weight: FontWeight) =>
  FONT_FAMILIES[family].weights.reduce((best, next) =>
    Math.abs(next - weight) < Math.abs(best - weight) ? next : best,
  );
