export const PRINT_TEMPLATES_PATH = "/settings/print-templates";

/** Editor a pantalla completa (app/routes/index.tsx). */
export const printTemplateEditPath = (id: number) =>
  `${PRINT_TEMPLATES_PATH}/edit/${id}`;

/**
 * Una plantilla del sistema, solo para verla: el editor sin paneles ni
 * edición (app/routes/index.tsx). Ruta aparte para que no se tome por el
 * editor.
 */
export const printTemplateViewPath = (code: string) =>
  `${PRINT_TEMPLATES_PATH}/view/${code}`;
