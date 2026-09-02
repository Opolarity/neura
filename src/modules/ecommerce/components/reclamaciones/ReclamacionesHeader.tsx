import { Button } from "@/components/ui/button";
import { Download, Loader2, SlidersHorizontal } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

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
      <Button variant="outline" onClick={onOpenFilters}>
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filtros
        {filtersActive && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
      </Button>

      {/* Exportar el libro es la constancia que puede pedir Indecopi, así que
          va tras su propio permiso y no colgado del de ver el listado. */}
      <ComponentPermission codeIn={["ecommerce_claims.download"]}>
        <Button onClick={onExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar
        </Button>
      </ComponentPermission>
    </div>
  </div>
);

export default ReclamacionesHeader;
