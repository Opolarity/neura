import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { SupportMessageEditor, type SupportMessageEditorHandle } from "./SupportMessageEditor";
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
  /** Solicitud a la que pertenece el borrador. */
  requestId: string;
  /**
   * Encola el mensaje (aparece al instante en el hilo). Devuelve true si quedó
   * encolado: solo entonces se limpia la caja.
   */
  onSend: (content: string, attachments?: SupportAttachment[]) => boolean;
  /** Archivos soltados sobre el hilo: pasan por las mismas validaciones. */
  droppedFiles?: { files: File[]; nonce: number } | null;
}

/** A partir de aquí se muestra el contador: antes solo estorbaría. */
const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 500;
const DRAFT_KEY_PREFIX = "support-draft:";
const DRAFT_SAVE_DELAY_MS = 400;

const numberFormat = new Intl.NumberFormat("es-PE");

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// El borrador es una comodidad por navegador: si el storage no está (modo
// privado, bloqueado) la caja funciona igual, solo que sin recordar el texto.
const readDraft = (requestId: string): string => {
  try {
    return window.localStorage.getItem(DRAFT_KEY_PREFIX + requestId) ?? "";
  } catch {
    return "";
  }
};

const writeDraft = (requestId: string, value: string) => {
  try {
    if (value.trim()) window.localStorage.setItem(DRAFT_KEY_PREFIX + requestId, value);
    else window.localStorage.removeItem(DRAFT_KEY_PREFIX + requestId);
  } catch {
    // sin storage no hay borrador; no es un error para el usuario
  }
};

export const SupportReplyBox = ({ requestId, onSend, droppedFiles }: SupportReplyBoxProps) => {
  // El borrador y lo que se envía son el mismo texto: Markdown simple
  const [initialDraft] = useState(() => readDraft(requestId));
  const [content, setContent] = useState(initialDraft);
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<SupportMessageEditorHandle>(null);
  const filesRef = useRef<File[]>(files);
  filesRef.current = files;
  // Enter llega desde el editor: se lee lo último escrito, no el render anterior
  const contentRef = useRef(content);

  const handleContentChange = useCallback((markdown: string) => {
    contentRef.current = markdown;
    setContent(markdown);
  }, []);

  const trimmed = content.trim();
  // Mismo criterio que la edge function: largo del texto recortado, en
  // unidades de JS (un emoji cuenta 2). Las marcas de formato (**, -, …)
  // también cuentan: son parte del texto que se envía. El servidor corta en 5000.
  const length = trimmed.length;
  const overLimit = length > MAX_MESSAGE_LENGTH;
  // El texto es obligatorio aunque haya adjuntos: la API rechaza mensajes vacíos.
  const canSend = length > 0 && !overLimit && !preparing;

  // Borrador por solicitud, con un respiro para no escribir en cada tecla
  useEffect(() => {
    const timer = window.setTimeout(() => writeDraft(requestId, content), DRAFT_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [content, requestId]);

  const previews = useMemo(
    () => files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((url) => url && URL.revokeObjectURL(url)),
    [previews],
  );

  const handleAddFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;

    const next = [...filesRef.current];
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
  }, []);

  // Archivos soltados sobre el hilo (el sheet los reenvía aquí). El nonce evita
  // agregarlos dos veces si el efecto se repite.
  const handledDropRef = useRef<number | null>(droppedFiles?.nonce ?? null);
  useEffect(() => {
    if (!droppedFiles || droppedFiles.nonce === handledDropRef.current) return;
    handledDropRef.current = droppedFiles.nonce;
    handleAddFiles(droppedFiles.files);
  }, [droppedFiles, handleAddFiles]);

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const message = contentRef.current.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH || preparing) return;

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

    const queued = onSend(message, attachments);
    // Si no se pudo encolar se conserva lo escrito y los archivos
    if (queued) {
      // clear() vacía el editor, deja el foco y dispara onChange con ""; se
      // puede seguir escribiendo el siguiente mientras este se envía
      editorRef.current?.clear();
      handleContentChange("");
      setFiles([]);
      writeDraft(requestId, "");
    }
  };

  const hasFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg transition-colors",
        dragging && "bg-primary/5 ring-2 ring-primary/40 ring-offset-4 ring-offset-background",
      )}
      onDragOver={(event) => {
        if (!hasFileDrag(event)) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        if (!hasFileDrag(event)) return;
        event.preventDefault();
        // El panel también escucha drops: sin esto se agregarían dos veces
        event.stopPropagation();
        setDragging(false);
        handleAddFiles(event.dataTransfer.files);
      }}
    >
      {/* Enter envía (dentro de una lista crea otro elemento), Shift+Enter
          salta de línea y mientras se compone un carácter Enter no envía.
          Crece hasta ~6 líneas y luego hace scroll interno. */}
      <SupportMessageEditor
        ref={editorRef}
        initialMarkdown={initialDraft}
        placeholder="Escribe una respuesta…"
        disabled={preparing}
        invalid={overLimit}
        onChange={handleContentChange}
        onSubmit={() => void handleSend()}
        onPasteFiles={handleAddFiles}
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
        <ul className="max-h-28 space-y-1 overflow-y-auto">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex min-w-0 items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
            >
              {previews[index] ? (
                <img
                  src={previews[index] ?? undefined}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded object-cover"
                />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                disabled={preparing}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Quitar ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {overLimit && (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">
            El mensaje supera el máximo de {numberFormat.format(MAX_MESSAGE_LENGTH)} caracteres
            que acepta soporte (te sobran {numberFormat.format(length - MAX_MESSAGE_LENGTH)}).
            Acórtalo para poder enviarlo.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 text-xs text-muted-foreground",
            overLimit && "text-destructive",
          )}
        >
          {length >= COUNTER_THRESHOLD
            ? `${numberFormat.format(length)} / ${numberFormat.format(MAX_MESSAGE_LENGTH)} caracteres`
            : "El equipo de soporte recibe tu mensaje en la solicitud."}
          <span className="hidden sm:inline"> · Enter envía, Shift+Enter salta de línea</span>
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={preparing || files.length >= MAX_MESSAGE_ATTACHMENTS}
            title={`Hasta ${MAX_MESSAGE_ATTACHMENTS} archivos de 4 MB cada uno`}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Adjuntar
          </Button>
          <Button size="sm" onClick={handleSend} disabled={!canSend}>
            {preparing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Responder
          </Button>
        </div>
      </div>
    </div>
  );
};
