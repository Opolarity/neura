/**
 * Validaciones de los campos del editor (components/commit-input). Las elige
 * quien usa el campo. Reciben el texto escrito y devuelven el valor a guardar,
 * o null si no vale: entonces el campo vuelve a mostrar el valor que tenía.
 */
export type Validator<T> = (text: string) => { value: T } | null;

/** Un número decimal, con punto o coma: "12", "-0,5", ".5". */
const NUMBER_PATTERN = /^-?(\d+([.,]\d*)?|[.,]\d+)$/;

interface NumberRule {
  min?: number;
  max?: number;
  /** Mayor que 0. */
  positive?: boolean;
  /** Sin decimales. */
  integer?: boolean;
}

/**
 * Un número dentro de sus límites. Sin `empty`, el campo vacío no vale; con
 * `empty`, vacío guarda ese valor (null = "Todo", "Auto"...).
 */
export function numberRule(rule: NumberRule): Validator<number>;
export function numberRule<E extends number | null>(
  rule: NumberRule & { empty: E },
): Validator<number | E>;
export function numberRule({
  min,
  max,
  positive,
  integer,
  empty,
}: NumberRule & { empty?: number | null }): Validator<number | null> {
  return (text) => {
    const trimmed = text.trim();
    if (trimmed === "") return empty !== undefined ? { value: empty } : null;
    if (!NUMBER_PATTERN.test(trimmed)) return null;

    const value = Number(trimmed.replace(",", "."));
    if (integer && !Number.isInteger(value)) return null;
    if (positive && value <= 0) return null;
    if (min !== undefined && value < min) return null;
    if (max !== undefined && value > max) return null;
    return { value };
  };
}
