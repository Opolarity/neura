import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { parseNumberInput } from "../utils/numberInput";

type CommitNumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur" | "type" | "min" | "max"
> & {
  value: number;
  /** Se llama al salir del campo (o con Enter) solo si lo escrito es válido y cambió el valor. */
  onCommit: (value: number) => void;
  /** Solo enteros (cantidad). Si no, se guardan 2 decimales. */
  integer?: boolean;
  /** Por debajo de este valor lo escrito es inválido y se conserva el anterior. */
  minValue?: number;
  /** Por encima de este valor se ajusta al máximo (p. ej. el stock). */
  maxValue?: number;
};

/**
 * Campo numérico que no toca el estado mientras se escribe: acepta cualquier texto y lo
 * valida al perder el foco (o con Enter). Si no es válido, vuelve al valor anterior; Escape
 * descarta lo escrito. Al enfocarlo se selecciona su contenido, para que lo que se teclee
 * lo reemplace. Así un cálculo que depende del valor (las reglas de precio) corre una
 * sola vez con el valor final y no con cada tecla.
 */
export function CommitNumberInput({
  value,
  onCommit,
  integer = false,
  minValue = 0,
  maxValue,
  onKeyDown,
  onFocus,
  onMouseUp,
  ...props
}: CommitNumberInputProps) {
  // null = no se está editando: se muestra el valor guardado.
  const [draft, setDraft] = useState<string | null>(null);
  // Al enfocar con un clic, el mouseup que sigue al foco pone el cursor y quita la selección.
  const justFocused = useRef(false);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    const parsed = parseNumberInput(draft, { integer });
    if (parsed === null || parsed < minValue) return;
    const next = maxValue !== undefined ? Math.min(parsed, maxValue) : parsed;
    if (next !== value) onCommit(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    justFocused.current = false;
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") setDraft(null);
    onKeyDown?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={draft ?? String(value)}
      onFocus={(e) => {
        setDraft(String(value));
        e.currentTarget.select();
        justFocused.current = true;
        onFocus?.(e);
      }}
      onMouseUp={(e) => {
        if (justFocused.current) {
          justFocused.current = false;
          e.preventDefault();
        }
        onMouseUp?.(e);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        justFocused.current = false;
        commit();
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
