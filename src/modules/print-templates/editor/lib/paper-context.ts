import { createContext, useContext } from "react";
import { impositionOf } from "./imposition";
import type {
  Imposition,
  ImpositionPreset,
  PaperHeight,
  PaperPreset,
  SystemPrintTemplate,
} from "../../types/printTemplates.types";

/** Medidas de la hoja que se edita: las fija su plantilla del sistema. */
export interface Paper {
  widthMm: number;
  /** `auto`: la hoja crece con su contenido (papel de rollo). */
  heightMm: PaperHeight;
  /** Lo que no entra sigue en otra hoja igual (SystemPrintTemplate). */
  multiPage: boolean;
  /**
   * Medidas elegibles: las recomendadas. Con ellas la Hoja deja cambiar su
   * medida (paperWidthMm/paperHeightMm de la Hoja).
   */
  presets?: readonly PaperPreset[];
  /** Cómo se acomoda la hoja en el papel al imprimir (lib/imposition). */
  imposition: Imposition;
  /** Los papeles recomendados de su plantilla del sistema. */
  impositionPresets?: readonly ImpositionPreset[];
}

export const PaperContext = createContext<Paper | null>(null);

export const usePaper = () => useContext(PaperContext);

/**
 * El papel de una plantilla: el de su plantilla del sistema o, si sus medidas
 * son elegibles, el que lleva su Hoja (si no lleva, el de por defecto). La
 * imposición, la que lleva su Hoja.
 */
export const paperOf = (
  system: SystemPrintTemplate,
  page?: {
    paperWidthMm?: unknown;
    paperHeightMm?: unknown;
    imposition?: unknown;
  },
): Paper => {
  const presets = system.paperPresets?.length ? system.paperPresets : undefined;
  const width = Number(page?.paperWidthMm);
  const height = Number(page?.paperHeightMm);
  const own = presets && width > 0 && height > 0;
  return {
    widthMm: own ? width : system.paperWidthMm,
    heightMm: own ? height : system.paperHeightMm,
    multiPage: system.multiPage ?? false,
    presets,
    imposition: impositionOf(system, page?.imposition),
    impositionPresets: system.impositionPresets,
  };
};
