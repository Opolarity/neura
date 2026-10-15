import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/utils";

interface PopoverListSkeletonProps {
  /** Cuántas filas: el tamaño de página, para ocupar lo que ocuparán los resultados. */
  count?: number;
  /** Lo que va antes de la miniatura: el número de fila o el hueco del check. */
  lead?: "number" | "check";
  /** Tamaño de la segunda línea de la fila real (text-xs = 16px, text-sm = 20px). */
  secondary?: "xs" | "sm";
  /** La fila real termina con una pastilla (p. ej. el stock). */
  badge?: boolean;
  /** Relleno de la fila real. */
  rowClassName?: string;
  /** Redondeo de la miniatura de la fila real. */
  thumbClassName?: string;
}

/**
 * Filas de carga para las listas dentro de un popover (buscadores de productos y
 * categorías). Copian la estructura de una fila real —miniatura de 40x40 y dos
 * líneas de texto—, así que miden lo mismo que ella (56px con py-2). Con eso el
 * popover mide igual cargando que con resultados, no salta al llegar los datos y
 * Radix lo coloca una sola vez.
 */
export function PopoverListSkeleton({
  count = 10,
  lead = "number",
  secondary = "xs",
  badge = false,
  rowClassName = "px-3 py-2",
  thumbClassName = "rounded",
}: PopoverListSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("flex w-full items-center gap-3", rowClassName)}>
          {lead === "number" ? (
            <span className="flex w-6 shrink-0 items-center">
              <Skeleton className="h-3 w-4" />
            </span>
          ) : (
            // El check de la fila real es un hueco de 16px cuando no está marcado.
            <span className="h-4 w-4 shrink-0" />
          )}
          <Skeleton className={cn("h-10 w-10 shrink-0", thumbClassName)} />
          <span className="min-w-0 flex-1">
            <span className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-3/5" />
            </span>
            <span className={cn("flex items-center", secondary === "sm" ? "h-5" : "h-4")}>
              <Skeleton className={cn(secondary === "sm" ? "h-3.5 w-2/5" : "h-3 w-10")} />
            </span>
          </span>
          {badge && <Skeleton className="h-5 w-7 shrink-0 rounded-full" />}
        </div>
      ))}
    </div>
  );
}
