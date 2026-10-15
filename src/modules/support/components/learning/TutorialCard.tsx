import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LearningTutorial } from "../../types/Learning.types";

interface TutorialCardProps {
  tutorial: LearningTutorial;
  onOpen: (tutorial: LearningTutorial) => void;
}

/**
 * Miniatura 16:9. YouTube trae su imagen; los archivos subidos no, así que se
 * usa el primer cuadro del propio video (`#t=0.1` + `preload="metadata"`: el
 * navegador baja solo lo necesario para pintar ese cuadro).
 */
const TutorialThumbnail = ({ tutorial }: { tutorial: LearningTutorial }) => {
  if (tutorial.source === "youtube" && tutorial.thumbnailUrl) {
    return (
      <img
        src={tutorial.thumbnailUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }

  if (tutorial.source === "upload" && tutorial.videoUrl) {
    return (
      <video
        src={`${tutorial.videoUrl}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none h-full w-full object-cover"
      />
    );
  }

  return null;
};

export const TutorialCard = ({ tutorial, onOpen }: TutorialCardProps) => (
  <button
    type="button"
    onClick={() => onOpen(tutorial)}
    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm ring-offset-background transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      <TutorialThumbnail tutorial={tutorial} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 shadow transition-transform group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5" />
        </span>
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-2 p-4">
      <p className="line-clamp-2 font-medium text-foreground">{tutorial.title}</p>
      {tutorial.category && (
        <p className="text-xs text-muted-foreground">{tutorial.category.name}</p>
      )}
      {tutorial.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {tutorial.tags.map((tag) => (
            <Badge key={tag.slug} variant="secondary" className="font-normal">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  </button>
);
