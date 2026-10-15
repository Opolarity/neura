import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LearningTutorial } from "../../types/Learning.types";

interface TutorialPlayerDialogProps {
  tutorial: LearningTutorial | null;
  onClose: () => void;
}

/**
 * youtube-nocookie: no deja cookies de seguimiento hasta que se reproduce.
 * Si por algún motivo no llegó el id, se usa el embed que arma Tasks.
 */
const youtubeEmbedSrc = (tutorial: LearningTutorial) =>
  tutorial.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(tutorial.youtubeId)}?rel=0`
    : tutorial.embedUrl;

const TutorialPlayer = ({ tutorial }: { tutorial: LearningTutorial }) => {
  if (tutorial.source === "youtube") {
    const src = youtubeEmbedSrc(tutorial);
    if (!src) return null;
    return (
      <iframe
        src={src}
        title={tutorial.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  if (!tutorial.videoUrl) return null;
  return (
    <video controls playsInline preload="metadata" className="h-full w-full">
      <source src={tutorial.videoUrl} type={tutorial.mimeType ?? undefined} />
      Tu navegador no puede reproducir este video.
    </video>
  );
};

export const TutorialPlayerDialog = ({ tutorial, onClose }: TutorialPlayerDialogProps) => (
  <Dialog open={tutorial !== null} onOpenChange={(open) => !open && onClose()}>
    {/* pt-12 deja la X de cerrar por encima del video, no encima de él. */}
    <DialogContent className="max-w-4xl gap-4 pt-12">
      {tutorial && (
        <>
          {/* El reproductor se monta solo con el dialog abierto: al cerrarlo
              se desmonta y el video deja de sonar. */}
          <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
            <TutorialPlayer key={tutorial.id} tutorial={tutorial} />
          </div>

          <DialogHeader className="text-left">
            <DialogTitle>{tutorial.title}</DialogTitle>
            {tutorial.description ? (
              <DialogDescription className="whitespace-pre-line">
                {tutorial.description}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">Video tutorial</DialogDescription>
            )}
          </DialogHeader>

          {(tutorial.category || tutorial.tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1">
              {tutorial.category && (
                <Badge variant="outline" className="font-normal">
                  {tutorial.category.name}
                </Badge>
              )}
              {tutorial.tags.map((tag) => (
                <Badge key={tag.slug} variant="secondary" className="font-normal">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
    </DialogContent>
  </Dialog>
);
