import { useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_MESSAGE_ATTACHMENTS,
  MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES,
  MAX_MESSAGE_ATTACHMENT_BYTES,
  MAX_MESSAGE_LENGTH,
  type SupportAttachment,
} from "../../types/Support.types";
import { readFileAsBase64 } from "../../utils/readFileAsBase64";
import { toastError } from "@/shared/utils/toastError";

interface SupportReplyBoxProps {
  sending: boolean;
  /** Devuelve true si el mensaje se envió: solo entonces se limpia la caja. */
  onSend: (content: string, attachments?: SupportAttachment[]) => Promise<boolean>;
}

/** A partir de aquí se muestra el contador: antes solo estorbaría. */
const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 500;

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const SupportReplyBox = ({ sending, onSend }: SupportReplyBoxProps) => {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = content.trim();
  const busy = sending || preparing;
  // El texto es obligatorio aunque haya adjuntos: la API rechaza mensajes vacíos.
  const canSend = trimmed.length > 0 && !busy;

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const next = [...files];
    let totalBytes = next.reduce((sum, file) => sum + file.size, 0);

    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_MESSAGE_ATTACHMENTS) {
        toast({ title: `Máximo ${MAX_MESSAGE_ATTACHMENTS} archivos por mensaje`, variant: "destructive" });
        break;
      }
      if (file.size > MAX_MESSAGE_ATTACHMENT_BYTES) {
        toast({ title: `"${file.name}" supera el límite de 4 MB`, variant: "destructive" });
        continue;
      }
      if (totalBytes + file.size > MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES) {
        toast({
          title: "Los adjuntos superan los 10 MB en total. Envíalos en varios mensajes.",
          variant: "destructive",
        });
        break;
      }
      totalBytes += file.size;
      next.push(file);
    }

    setFiles(next);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!canSend) return;

    let attachments: SupportAttachment[] | undefined;

    if (files.length > 0) {
      setPreparing(true);
      try {
        attachments = await Promise.all(
          files.map(async (file) => ({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            contentBase64: await readFileAsBase64(file),
          })),
        );
      } catch (error) {
        toastError(error, "No se pudieron leer los archivos");
        return;
      } finally {
        setPreparing(false);
      }
    }

    const sent = await onSend(trimmed, attachments);
    // En error se conserva lo escrito y los archivos, para no perder el mensaje
    if (sent) {
      setContent("");
      setFiles([]);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) =>
          setContent(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
        }
        onKeyDown={(event) => {
          // Enter envía, Shift+Enter hace salto de línea
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSend();
          }
        }}
        placeholder="Escribe una respuesta…"
        rows={3}
        disabled={busy}
        className="resize-none"
      />

      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(event) => {
          handleAddFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                disabled={busy}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Quitar ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {content.length >= COUNTER_THRESHOLD
            ? `${content.length} / ${MAX_MESSAGE_LENGTH} caracteres`
            : "El equipo de soporte recibe tu mensaje en la solicitud."}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || files.length >= MAX_MESSAGE_ATTACHMENTS}
            title={`Hasta ${MAX_MESSAGE_ATTACHMENTS} archivos de 4 MB cada uno`}
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Adjuntar
          </Button>
          <Button size="sm" onClick={handleSend} disabled={!canSend}>
            {busy ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Responder
          </Button>
        </div>
      </div>
    </div>
  );
};
