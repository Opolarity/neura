import {
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
} from "react";
import { Input } from "@/components/ui/input";
import type { Validator } from "../lib/validators";

type CommitInputProps<T> = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  /** El control que se pinta: Input, o InputGroupInput dentro de un InputGroup. */
  as?: ComponentType<ComponentProps<"input">>;
  value: T;
  /** La pone quien usa el campo (lib/validators). */
  validate: Validator<T>;
  onCommit: (value: T) => void;
  /** Cómo se muestra el valor. Por defecto String, con null como vacío. */
  format?: (value: T) => string;
};

const defaultFormat = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

/**
 * El input estándar del editor. Todos los campos de texto o número lo usan:
 * - Al recibir el foco selecciona todo su contenido.
 * - Lo escrito es un borrador: no cambia nada hasta pulsar Enter o salir del
 *   campo. Escape lo descarta.
 * - Antes de aplicarlo pasa por `validate`; si no vale, vuelve el valor que
 *   tenía.
 */
export function CommitInput<T>({
  as: Control = Input,
  value,
  validate,
  onCommit,
  format = defaultFormat,
  onFocus,
  onBlur,
  onKeyDown,
  onMouseDown,
  onMouseUp,
  ...inputProps
}: CommitInputProps<T>) {
  const [draft, setDraft] = useState<string | null>(null);
  // El clic que da el foco no debe deshacer la selección al soltar el botón.
  const keepSelection = useRef(false);

  /** Valida el borrador y lo aplica. Devuelve el valor con el que queda. */
  const commit = (): T => {
    // Sin cambios en el texto no se aplica nada: un campo vacío ("Mixto") que
    // solo recibió el foco no pasa a valer lo que el vacío signifique.
    if (draft === null || draft === format(value)) return value;
    const result = validate(draft);
    if (!result) return value;
    if (!Object.is(result.value, value)) onCommit(result.value);
    return result.value;
  };

  return (
    <Control
      {...inputProps}
      type="text"
      value={draft ?? format(value)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setDraft(format(value));
        e.currentTarget.select();
        onFocus?.(e);
      }}
      onMouseDown={(e) => {
        keepSelection.current = document.activeElement !== e.currentTarget;
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (keepSelection.current) e.preventDefault();
        keepSelection.current = false;
        onMouseUp?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          const next = e.key === "Enter" ? commit() : value;
          setDraft(format(next));
          e.currentTarget.select();
        }
        onKeyDown?.(e);
      }}
      onBlur={(e) => {
        commit();
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
