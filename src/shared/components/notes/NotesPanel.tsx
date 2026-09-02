import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";
import { formatDateTime } from "@/shared/utils/date";

/**
 * Panel de notas reutilizable.
 *
 * El diseño sale del panel de notas de editar venta (`sales/components/
 * SaleSidebar.tsx`): burbujas sobre `bg-muted`, autor y fecha al pie, hilo con
 * scroll propio y una sola línea abajo para escribir, con Enter para enviar.
 *
 * Se extrajo al entrar Reclamaciones, que necesitaba lo mismo. Lo que aporta
 * sobre el original es el botón de refrescar: en una pantalla que se queda
 * abierta, otra persona puede dejar una nota y no hay forma de enterarse sin
 * recargar. `SaleSidebar` puede migrar aquí y lo gana.
 *
 * Lo que NO hace: cargar ni guardar. Los datos y el envío los pone quien lo
 * usa, porque cada módulo tiene su propia tabla puente (`order_notes`,
 * `complaints_book_note`) y sus propias reglas.
 */

export interface NotesPanelItem {
  id: number | string;
  message: string;
  /** ISO. Se formatea con formatDateTime. */
  createdAt: string;
  authorName: string;
  /** Imagen o PDF adjunto, si el módulo los admite. */
  imageUrl?: string | null;
  /** Distintivo opcional de la nota (p. ej. "Respuesta enviada"). */
  badge?: React.ReactNode;
}

interface NotesPanelProps {
  notes: NotesPanelItem[];
  /** Refresco del hilo: atenúa la lista sin bloquear la pantalla. */
  loading?: boolean;
  /** Envío en curso: bloquea el composer. */
  sending?: boolean;
  /**
   * Devuelve true si la nota se guardó, para limpiar el composer. Sin este
   * prop el panel es de solo lectura.
   */
  onSend?: (message: string, file: File | null) => Promise<boolean> | boolean;
  /** Sin este prop no se pinta el botón de refrescar. */
  onRefresh?: () => void;
  title?: string;
  emptyMessage?: string;
  placeholder?: string;
  /** Habilita el clip para adjuntar imagen o PDF; el archivo va en onSend. */
  allowAttachments?: boolean;
  /** Codes que puede exigir el composer; sin ellos solo se ve el hilo. */
  composerPermissionCodes?: string[];
  /**
   * Alto del hilo. Por defecto ocupa el espacio disponible, que es lo que hace
   * falta dentro de un sidebar de alto completo; en una tarjeta suelta conviene
   * un alto fijo (`h-[340px]`) para que el composer no se mueva de sitio.
   */
  scrollClassName?: string;
  className?: string;
}

const ACCEPTED_FILES =
  "image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf";

export const NotesPanel = ({
  notes,
  loading = false,
  sending = false,
  onSend,
  onRefresh,
  title = "Notas",
  emptyMessage = "No hay notas",
  placeholder = "Escribir una nota...",
  allowAttachments = false,
  composerPermissionCodes,
  scrollClassName = "flex-1",
  className,
}: NotesPanelProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!onSend) return;

    const trimmed = message.trim();
    if (!trimmed && !selectedFile) return;

    const ok = await onSend(trimmed, selectedFile);
    if (ok) {
      setMessage("");
      clearFile();
    }
  };

  const composer = (
    <div className="space-y-2">
      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          {selectedFile.type.startsWith("image/") ? (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearFile}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </>
        )}

        <Input
          placeholder={placeholder}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || (!message.trim() && !selectedFile)}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`flex flex-col overflow-hidden ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              title="Actualizar notas"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <ScrollArea className={`${scrollClassName} pr-4`}>
          <div className="space-y-3">
            {loading && notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Cargando notas...
              </p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                {emptyMessage}
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-muted p-3 rounded-lg space-y-2 transition-opacity ${
                    loading ? "opacity-60" : ""
                  }`}
                >
                  {note.badge && <div className="flex">{note.badge}</div>}

                  {note.message && (
                    <p className="text-sm whitespace-pre-line">{note.message}</p>
                  )}

                  {note.imageUrl && (
                    <div className="mt-2">
                      {note.imageUrl.endsWith(".pdf") ? (
                        <a
                          href={note.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium flex items-center gap-2 text-sm hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          Ver PDF
                        </a>
                      ) : (
                        <a href={note.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={note.imageUrl}
                            alt="Adjunto"
                            className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ maxHeight: "200px" }}
                          />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{note.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {onSend &&
          (composerPermissionCodes?.length ? (
            <ComponentPermission codeIn={composerPermissionCodes}>
              {composer}
            </ComponentPermission>
          ) : (
            composer
          ))}
      </CardContent>
    </Card>
  );
};

export default NotesPanel;
