import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  /** Se dispara cada vez que el sentinel entra en el viewport del root. */
  onIntersect: () => void;
  /** Si es false no se monta el observer (p. ej. ya no hay más páginas). */
  enabled?: boolean;
  /** Contenedor scrollable. null = viewport de la ventana. */
  root?: Element | null;
  rootMargin?: string;
}

/**
 * Observa un elemento "sentinel" y avisa cuando aparece en pantalla. Pensado
 * para scroll infinito: se coloca el ref al final de la lista.
 *
 * Devuelve un ref callback (no un objeto ref) para que el observer se re-monte
 * si el nodo cambia — necesario cuando la lista se monta/desmonta, como en un
 * Popover.
 */
export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  root = null,
  rootMargin = '0px',
}: UseIntersectionObserverOptions) {
  const [node, setNode] = useState<Element | null>(null);
  // El callback puede cambiar en cada render; guardarlo en un ref evita
  // desmontar y remontar el observer por eso.
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current();
        }
      },
      { root, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node, root, rootMargin]);

  return useCallback((element: Element | null) => setNode(element), []);
}
