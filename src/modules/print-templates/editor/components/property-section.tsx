import type { ReactNode } from "react";

/**
 * Una sección del panel de propiedades. Siempre abierta: las secciones se
 * separan solo con su borde inferior, sin colapsar. Sin `title` no lleva
 * nombre: la primera, la de lo propio del componente, se sobreentiende.
 */
export function PropertySection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border px-4 py-3">
      {title && <p className="text-sm font-medium">{title}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
