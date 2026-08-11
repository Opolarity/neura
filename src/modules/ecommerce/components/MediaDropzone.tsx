import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface MediaDropzoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

const ACCEPTED_TYPES = ["image/*", "video/*"];

const MediaDropzone = ({ onUpload, uploading }: MediaDropzoneProps) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (uploading) return;
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
      );
      if (files.length) onUpload(files);
    },
    [onUpload, uploading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onUpload(files);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        shrink-0 flex flex-row items-center justify-center gap-3 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors
        ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-muted-foreground/40"}
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      {uploading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <div className="text-center">
        <span className="text-sm font-medium text-foreground">
          {uploading ? "Subiendo archivos..." : "Arrastra y suelta archivos aquí"}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          o haz clic para seleccionar · Imágenes y videos
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default MediaDropzone;
