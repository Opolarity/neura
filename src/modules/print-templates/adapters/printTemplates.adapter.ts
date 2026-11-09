import {
  findSystemPrintTemplate,
  sectionOf,
} from "../constants/systemPrintTemplates";
import {
  PrintTemplateDetail,
  PrintTemplateItem,
} from "../types/printTemplates.types";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** Fila tal como la devuelven sp_print_templates_list y sp_print_template_get. */
interface PrintTemplateRow {
  id: number;
  title?: string | null;
  system_code?: string | null;
  content_json?: Record<string, unknown> | null;
  is_default?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by_name?: string | null;
}

/** Fila de sp_print_templates_list → modelo de UI (personalizada). */
export const toPrintTemplateItem = (raw: unknown): PrintTemplateItem => {
  const row = raw as PrintTemplateRow;
  const systemCode = row.system_code ?? "";
  // La hoja es la de su plantilla del sistema.
  const system = findSystemPrintTemplate(systemCode);
  return {
    key: `templates:${row.id}`,
    id: row.id,
    type: "templates",
    title: row.title ?? "",
    systemCode,
    section: sectionOf(systemCode),
    paperWidthMm: system?.paperWidthMm ?? null,
    paperHeightMm: system?.paperHeightMm ?? null,
    multiPage: system?.multiPage ?? false,
    paperEditable: Boolean(system?.paperPresets?.length),
    hasDesign: system?.hasDesign ?? false,
    isDefault: row.is_default ?? false,
    isActive: row.is_active ?? true,
    createdAt: toTextOrNull(row.created_at),
    updatedAt: toTextOrNull(row.updated_at),
    createdByName: toTextOrNull(row.created_by_name),
  };
};

/** Respuesta de sp_print_template_get → plantilla del editor. */
export const toPrintTemplateDetail = (raw: unknown): PrintTemplateDetail => {
  const row = raw as PrintTemplateRow;
  return {
    id: row.id,
    title: row.title ?? "",
    systemCode: row.system_code ?? "",
    contentJson: row.content_json ?? null,
    isActive: row.is_active ?? true,
  };
};
