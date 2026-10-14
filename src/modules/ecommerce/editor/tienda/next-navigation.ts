// Sustituto de `next/navigation` para los bloques del editor. En el canvas los
// bloques no navegan (editable-account solo lo intenta con el editor apagado),
// así que el router no hace nada.
const noop = (..._args: unknown[]) => {};

export function useRouter() {
  return { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop };
}
