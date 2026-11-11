import type { ReactElement } from "react";
import { Element } from "@craftjs/core";
import type { SystemPrintTemplate } from "../../types/printTemplates.types";
import {
  PdfContainer,
  type PdfContainerProps,
} from "../components/pdf-container";
import { SYSTEM_DESIGNS } from "../designs";

/**
 * Con qué arranca una plantilla nueva: el diseño de hoy de su plantilla del
 * sistema (editor/designs) si lo tiene; si no, la hoja vacía, un Contenedor
 * que la ocupa entera. `page` son las props de la Hoja (lib/page-props).
 */
export const initialDesign = (
  system: SystemPrintTemplate,
  page: Partial<PdfContainerProps>,
): ReactElement =>
  SYSTEM_DESIGNS[system.code]?.(page) ?? (
    <Element is={PdfContainer} canvas {...page} />
  );
