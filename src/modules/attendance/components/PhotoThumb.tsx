import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePhotoUrl } from "../hooks/usePhotoUrl";

interface PhotoThumbProps {
  path: string | null;
  /** Título del visor al ampliar (nombre y hora de la marca). */
  title: string;
}

/** Miniatura de la foto de una marca; al hacer click se amplía. */
export const PhotoThumb = ({ path, title }: PhotoThumbProps) => {
  const url = usePhotoUrl(path);
  const [open, setOpen] = useState(false);

  if (!path) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted" title="Sin foto">
        <ImageOff className="w-4 h-4" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 w-10 overflow-hidden rounded-md border bg-muted"
        title="Ver foto"
      >
        {url && <img src={url} alt={title} className="h-full w-full object-cover" />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {url ? <img src={url} alt={title} className="w-full rounded-md" /> : <p className="text-sm">Cargando foto...</p>}
        </DialogContent>
      </Dialog>
    </>
  );
};
