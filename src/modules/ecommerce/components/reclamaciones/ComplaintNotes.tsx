import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";
import { formatDateTime } from "@/shared/utils/date";
import type { ComplaintNote } from "../../types/reclamaciones.types";

interface ComplaintNotesProps {
  notes: ComplaintNote[];
  saving: boolean;
  /** Refresco del hilo. No bloquea la pantalla: solo atenúa la lista. */
  loading?: boolean;
  onAddNote: (message: string) => Promise<boolean>;
}

/**
 * Hilo de seguimiento del reclamo.
 *
 * Las notas son internas: solo las ve el equipo. Las que salieron por correo al
 * reclamante quedan en el mismo hilo marcadas como respuesta, para que se lea
 * de corrido qué se hizo y qué se le dijo.
 *
 * La tabla y el SP existían desde el inicio, pero ningún frontend los llamaba.
 */
const ComplaintNotes = ({
  notes,
  saving,
  loading = false,
  onAddNote,
}: ComplaintNotesProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const ok = await onAddNote(trimmed);
    if (ok) setMessage("");
  };

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">Cargando notas...</p>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <p className="text-sm">Todavía no hay notas en este reclamo</p>
            </>
          )}
        </div>
      ) : (
        <ul
          className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{note.userName}</span>
                {note.isReply && <Badge variant="info">Respuesta enviada</Badge>}
              </div>
              <p className="mt-1 whitespace-pre-line text-sm">{note.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ComponentPermission codeIn={["ecommerce_claims.note"]}>
        <div className="space-y-2 border-t pt-4">
          <Textarea
            rows={3}
            placeholder="Escribe una nota interna..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={saving || message.trim().length === 0}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Agregar nota
            </Button>
          </div>
        </div>
      </ComponentPermission>
    </div>
  );
};

export default ComplaintNotes;
