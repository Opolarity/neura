import {
  PRINT_DATA_SOURCES,
  type PrintDataSourceId,
} from "../../constants/printDataSources";
import { useDataSources } from "./data-table";
import { useSourceValue } from "./print-data";
import {
  CONTEXT_SOURCES,
  isContextSource,
  useContextValues,
  type ContextSourceId,
} from "./context-values";

/**
 * «Ocultar si está vacío» de un Contenedor: se oculta cuando el dato que
 * elige (un origen y un valor, como los de un Texto) está vacío o es cero,
 * por ejemplo la fila «OP. GRATUITAS» sin operaciones gratuitas. Sin dato
 * elegido, se oculta siempre.
 *
 * Mientras se edita no se oculta: lleva una marca en la esquina
 * (components/selection-overlay). En la vista previa, en la vista y al
 * imprimir, sí.
 */

export type HideOrigin = PrintDataSourceId | ContextSourceId | "";

export interface HideRuleProps {
  hideWhenEmpty: boolean;
  hideSource: HideOrigin;
  hideKey: string;
}

export const DEFAULT_HIDE_RULE: HideRuleProps = {
  hideWhenEmpty: false,
  hideSource: "",
  hideKey: "",
};

/** Vacío, sin texto o cero. */
export const isEmptyValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === 0 ||
  (typeof value === "string" && value.trim() === "");

/**
 * Los orígenes que se pueden elegir, en dos grupos (las listas de datos del
 * documento y la configuración), y los valores de cada uno. Lo de un QR no.
 */
export function useHideOrigins() {
  const lists = useDataSources().filter((source) => source.values?.length);
  const origins = [
    ...lists.map((source) => ({
      value: source.id as HideOrigin,
      label: source.label,
      group: "Listas de datos",
    })),
    ...Object.values(CONTEXT_SOURCES).map((source) => ({
      value: source.id as HideOrigin,
      label: source.label,
      group: "Configuración",
    })),
  ];
  const valuesOf = (origin: HideOrigin) => {
    if (!origin) return [];
    if (isContextSource(origin)) {
      const source = CONTEXT_SOURCES[origin];
      return [...source.fields, ...(source.switches ?? [])].map((field) => ({
        value: field.key,
        label: field.label,
      }));
    }
    return (PRINT_DATA_SOURCES[origin]?.values ?? [])
      .filter((field) => field.kind !== "qr")
      .map((field) => ({ value: field.key, label: field.label }));
  };
  return { origins, valuesOf };
}

/**
 * Si el Contenedor se oculta ahora: nunca mientras se edita; fuera de la
 * edición, si su dato está vacío (el del documento que se imprime; en el
 * editor, el de ejemplo; o el de la configuración).
 */
export function useHiddenByRule(rule: HideRuleProps, editing: boolean) {
  const contextValue = useContextValues();
  const sourceValue = useSourceValue();
  if (!rule.hideWhenEmpty || editing) return false;
  if (!rule.hideSource || !rule.hideKey) return true;
  const value = isContextSource(rule.hideSource)
    ? contextValue(rule.hideSource, rule.hideKey)
    : sourceValue(PRINT_DATA_SOURCES[rule.hideSource], rule.hideKey);
  return isEmptyValue(value);
}
