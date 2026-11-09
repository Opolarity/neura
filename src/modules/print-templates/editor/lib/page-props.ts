import type { PdfContainerProps } from "../components/pdf-container";
import type {
  Imposition,
  SystemPrintTemplate,
} from "../../types/printTemplates.types";
import { impositionOf } from "./imposition";

/**
 * La Hoja de una plantilla nueva: un Contenedor raíz en columna (los
 * contenedores arrancan en fila) con el margen interior de su plantilla del
 * sistema, o poco (3 mm; los contenedores, 5). Guarda su imposición: la
 * elegida al crearla o la de por defecto.
 */
export const pageProps = (
  system: SystemPrintTemplate,
  paper?: { widthMm: number; heightMm: number } | null,
  imposition?: Imposition | null,
): Partial<PdfContainerProps> => ({
  isPage: true,
  direction: "column",
  padding: system.pagePaddingMm ?? { top: 3, right: 3, bottom: 3, left: 3 },
  imposition: impositionOf(system, imposition),
  // Con medidas elegibles, la Hoja guarda la suya (la elegida al crearla).
  ...(system.paperPresets?.length && {
    paperWidthMm: paper?.widthMm ?? system.paperWidthMm,
    // Las medidas elegibles son siempre de alto fijo.
    paperHeightMm:
      paper?.heightMm ??
      (system.paperHeightMm === "auto" ? undefined : system.paperHeightMm),
  }),
});
