import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface MediaGalleryHeaderProps {
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
}

const MediaGalleryHeader = ({ onOpenFilters, hasActiveFilters }: MediaGalleryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Galería de medios</h1>
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        onClick={onOpenFilters}
        className="gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
      </Button>
    </div>
  );
};

export default MediaGalleryHeader;
