import { Download, Paperclip } from "lucide-react";
import type { SupportAttachmentFile } from "../../types/Support.types";

const formatFileSize = (bytes: number | null): string | null => {
  if (bytes === null || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

/**
 * Enlace de descarga de un adjunto. Lo usan tanto los adjuntos de la solicitud
 * como los de cada mensaje del hilo: mismo formato en ambos.
 * `fileUrl` viene de la API y se usa TAL CUAL, no se construye a mano.
 */
export const SupportAttachmentLink = ({ file }: { file: SupportAttachmentFile }) => {
  const size = formatFileSize(file.sizeBytes);

  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
    >
      <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate">{file.fileName}</span>
      {size && (
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{size}</span>
      )}
      <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </a>
  );
};
