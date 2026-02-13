import { Video, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDisplay } from "@/shared/utils/date";
import type { Medio } from "../types/medios.types";

interface MediaGridProps {
  medios: Medio[];
  loading: boolean;
  onSelect: (medio: Medio) => void;
  onDelete: (medio: Medio) => void;
}

const MediaGrid = ({ medios, loading, onSelect, onDelete }: MediaGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!medios.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Video className="h-12 w-12 mb-3" />
        <p className="text-sm">No hay medios subidos</p>
      </div>
    );
  }

  const isVideo = (mimetype: string | null) => mimetype?.startsWith("video/");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {medios.map((medio) => (
        <Card
          key={medio.id}
          className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
          onClick={() => onSelect(medio)}
        >
          <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
            {isVideo(medio.mimetype) ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Video className="h-10 w-10" />
                <span className="text-xs">Video</span>
              </div>
            ) : (
              <img
                src={medio.url}
                alt={medio.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <div className="p-2">
            <p className="text-xs font-medium truncate text-foreground">{medio.name}</p>
            <p className="text-[10px] text-muted-foreground">{formatDateDisplay(medio.created_at)}</p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(medio);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default MediaGrid;
