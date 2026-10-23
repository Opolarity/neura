import { Download, Loader2, SlidersHorizontal } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface ReclamacionesHeaderProps {
  onOpenFilters: () => void;
  onExport: () => void;
  exporting: boolean;
  filtersActive: boolean;
}

/**
 * Header de la pantalla de Reclamaciones: solo el título y las acciones, sin
 * descripción debajo ni icono decorativo (parte 4 del sistema visual).
 */
const ReclamacionesHeader = ({
  onOpenFilters,
  onExport,
  exporting,
  filtersActive,
}: ReclamacionesHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Reclamaciones</h1>

    <div className="flex gap-2">
      <TooltipIconButton
        variant="outline"
        onClick={onOpenFilters}
        icon={<SlidersHorizontal className="w-4 h-4" />}
        label="Filtros"
      >
        {filtersActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </TooltipIconButton>

      {/* Exportar el libro es la constancia que puede pedir Indecopi, así que
          va tras su propio permiso y no colgado del de ver el listado. */}
      <ComponentPermission codeIn={["ecommerce_claims.download"]}>
        <TooltipIconButton
          onClick={onExport}
          disabled={exporting}
          icon={
            exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )
          }
          label="Exportar"
        />
      </ComponentPermission>
    </div>
  </div>
);

export default ReclamacionesHeader;
