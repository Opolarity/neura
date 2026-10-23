import type { ReactNode } from "react";

// Única forma de marcar un campo opcional en el formulario de reglas: los
// obligatorios no llevan marca. Opcional = la columna admite NULL (o tiene
// valor por defecto) y create-price-rule no la exige.
export const OptionalBadge = () => (
  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
    Opcional
  </span>
);

export const LabelRow = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2">{children}</div>
);
