import { SlidersHorizontal } from "lucide-react";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";

interface MediaGalleryHeaderProps {
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
}

const MediaGalleryHeader = ({ onOpenFilters, hasActiveFilters }: MediaGalleryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Galería de medios</h1>
      <TooltipIconButton
        variant={hasActiveFilters ? "default" : "outline"}
        onClick={onOpenFilters}
        icon={<SlidersHorizontal className="w-4 h-4" />}
        label="Filtros"
      />
    </div>
  );
};

export default MediaGalleryHeader;
