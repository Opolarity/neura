import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface MediaGalleryHeaderProps {
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
}

const MediaGalleryHeader = ({ onOpenFilters, hasActiveFilters }: MediaGalleryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Galería de Medios</h1>
        <p className="text-muted-foreground">Gestión de imágenes y videos</p>
      </div>
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
