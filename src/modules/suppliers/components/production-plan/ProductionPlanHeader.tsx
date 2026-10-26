import { Download, Loader2 } from "lucide-react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface ProductionPlanHeaderProps {
  total: number;
  /** Descarga TODO lo filtrado, no la página que se está viendo. */
  onExport: () => void;
  exporting: boolean;
}

/**
 * El título, el contador y la descarga. El rango de entrega ya no se enseña
 * aquí: no viene puesto, y cuando el usuario lo aplica es el botón Filtrar en
 * morado lo que avisa de que la lista está acotada.
 */
const ProductionPlanHeader = ({
  total,
  onExport,
  exporting,
}: ProductionPlanHeaderProps) => (
  <div className="flex justify-between items-center gap-4">
    <h1 className="text-2xl font-bold text-foreground">
      Plan maestro producción
    </h1>
    {/* Sin botón de crear: aquí no se da de alta nada. Una variación se añade
        desde su orden, que es donde están las reglas de bloqueo. */}
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-muted-foreground text-sm">
        {total} {total === 1 ? "variación" : "variaciones"}
      </span>
      <TooltipIconButton
        variant="outline"
        onClick={onExport}
        disabled={exporting || total === 0}
        icon={
          exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )
        }
        label="Descargar Excel"
      />
    </div>
  </div>
);

export default ProductionPlanHeader;
