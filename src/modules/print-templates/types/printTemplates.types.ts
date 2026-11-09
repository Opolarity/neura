/**
 * Plantillas de impresión. Dos tipos:
 *   system     una por cada PDF que imprime el ERP, en el código
 *              (constants/systemPrintTemplates): su code dice en qué botón se
 *              imprime y su hoja tiene medidas fijas. No se eliminan.
 *   templates  las personalizadas del tenant (tabla `print_templates`,
 *              migración 202610260005): parten de una del sistema, cuyo code
 *              guardan en system_code. Se eliminan con is_active = false.
 */

import type { PrintDataSourceId } from "../constants/printDataSources";

export type PrintTemplateType = "system" | "templates";

/**
 * Alto del papel: en mm, o `auto` en el papel de rollo, donde la hoja crece
 * con su contenido (nunca por debajo de AUTO_PAPER_MIN_HEIGHT_MM).
 */
export type PaperHeight = number | "auto";

/** Una medida recomendada de una plantilla con medidas elegibles. */
export interface PaperPreset {
  label: string;
  widthMm: number;
  heightMm: number;
}

/** Orden de las copias: intercalado (1, 2, 3, 1, 2, 3) o agrupado (1, 1, 2, 2). */
export type ImpositionOrder = "collated" | "grouped";

/**
 * Imposición (editor/lib/imposition): cómo se acomoda la página lógica (la
 * que se diseña) en la hoja física (la del PDF). Medidas en mm.
 */
export interface Imposition {
  /** La misma página, N veces lado a lado (las columnas del rollo). */
  columns: number;
  /** El espacio entre una columna y la siguiente. */
  gapMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  /** El documento entero, N veces. */
  copies: number;
  order: ImpositionOrder;
}

/** El papel: columnas, separación y márgenes (sin las copias). */
export type ImpositionLayout = Pick<
  Imposition,
  "columns" | "gapMm" | "marginLeftMm" | "marginRightMm"
>;

/** Una imposición recomendada: el papel de una impresora conocida. */
export interface ImpositionPreset {
  label: string;
  /** Columnas, separación y márgenes; las copias no cambian. */
  imposition: ImpositionLayout;
}

/** Las áreas del listado, en su orden. */
export const PRINT_TEMPLATE_AREAS = [
  "Ventas",
  "Guías",
  "Etiquetas",
  "Compras",
  "Producción",
] as const;

export type PrintTemplateArea = (typeof PRINT_TEMPLATE_AREAS)[number];

/** Plantilla del sistema: vive en el código, no en la base. */
export interface SystemPrintTemplate {
  /** Lo guarda la personalizada y lo usa el botón del ERP que imprime. */
  code: string;
  /** Sección del ERP a la que pertenece (el PDF que diseña). */
  section: string;
  /** El área del ERP: agrupa los documentos en el listado. */
  area: PrintTemplateArea;
  paperWidthMm: number;
  paperHeightMm: PaperHeight;
  /**
   * Su diseño de hoy ya está hecho con los componentes del editor
   * (editor/designs): se ve, sin editar, en la ruta view.
   */
  hasDesign?: boolean;
  /**
   * Medidas que se eligen al crear la plantilla (y se cambian en la Hoja):
   * las recomendadas, más una personalizada. La primera es la de por defecto
   * (paperWidthMm × paperHeightMm).
   */
  paperPresets?: readonly PaperPreset[];
  /**
   * Varias páginas: lo que no entra en la hoja sigue en la siguiente, del
   * mismo tamaño (la Tabla de datos se parte por filas y repite su
   * encabezado). Solo con un alto fijo.
   */
  multiPage?: boolean;
  /**
   * Margen interior con que arranca la Hoja de una plantilla nueva, en mm,
   * como los márgenes de su generador de PDF. Sin él, 3 mm por lado.
   */
  pagePaddingMm?: { top: number; right: number; bottom: number; left: number };
  /**
   * Las listas que puede mostrar con una Tabla de datos
   * (constants/printDataSources). Sin ninguna, la Tabla no se ofrece.
   */
  dataSources?: readonly PrintDataSourceId[];
  /**
   * Columnas con que arranca una Tabla de datos de cada fuente en este
   * documento, cuando no son las de la fuente (defaultColumns).
   */
  dataColumns?: Partial<Record<PrintDataSourceId, readonly string[]>>;
  /**
   * Los papeles en que se suele imprimir (columnas, separación y márgenes).
   * La primera es la de por defecto; sin ninguna, una columna sin márgenes.
   */
  impositionPresets?: readonly ImpositionPreset[];
}

/** Fila del listado, tal y como la deja el adapter. */
export interface PrintTemplateItem {
  /** Clave única del listado: las del sistema no tienen id. */
  key: string;
  /** Id en `print_templates`; null en las del sistema. */
  id: number | null;
  type: PrintTemplateType;
  title: string;
  systemCode: string;
  section: string;
  /** Medidas de la hoja de su plantilla del sistema; null si el code no existe. */
  paperWidthMm: number | null;
  paperHeightMm: PaperHeight | null;
  multiPage: boolean;
  /** Las medidas se eligen al crearla (paperWidthMm es la de por defecto). */
  paperEditable: boolean;
  /** Su plantilla del sistema tiene diseño hecho en el editor (se ve). */
  hasDesign: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdByName: string | null;
}

/** Una personalizada abierta en el editor (sp_print_template_get). */
export interface PrintTemplateDetail {
  id: number;
  title: string;
  systemCode: string;
  /** Árbol serializado de craft.js; null mientras no se haya guardado nada. */
  contentJson: Record<string, unknown> | null;
  isActive: boolean;
}

/** Alta desde el modal: nombre y la plantilla del sistema que se personaliza. */
export interface CreatePrintTemplateData {
  title: string;
  systemCode: string;
  contentJson?: Record<string, unknown> | null;
}

/** Edición: lo que no se manda queda como está. */
export interface UpdatePrintTemplateData {
  title?: string;
  contentJson?: Record<string, unknown>;
  isActive?: boolean;
}

/** `true` solo activas, `false` solo inactivas, `null` todas. */
export type PrintTemplateActiveFilter = boolean | null;

export interface PrintTemplateFilters {
  search?: string | null;
  /** Sección (code de la plantilla del sistema); null = todas. */
  system_code?: string | null;
  is_active?: PrintTemplateActiveFilter;
  limit?: number;
  offset?: number;
}

/** Respuesta de sp_print_templates_list. */
export interface PrintTemplatesListResponse {
  success: boolean;
  error?: string;
  data?: unknown[];
  total?: number;
}
