import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";
import { formatDateTime } from "@/shared/utils/date";
import type { ComplaintNote } from "../../types/reclamaciones.types";

interface ComplaintNotesProps {
  notes: ComplaintNote[];
  /** Refresco del hilo: atenúa la lista sin bloquear la pantalla. */
  loading: boolean;
  /** Envío en curso: bloquea el composer. */
  saving: boolean;
  onRefresh: () => void;
  onAddNote: (message: string) => Promise<boolean>;
}

/**
 * Hilo de seguimiento del reclamo.
 *
 * El aspecto es el del panel de notas de editar venta (`sales/components/
 * SaleSidebar.tsx`) — burbujas sobre `bg-muted`, autor y fecha al pie, scroll
 * propio y una línea abajo con Enter para enviar — para que quien usa las dos
 * pantallas no tenga que aprender dos cosas. El código va aparte a propósito:
 * las notas de venta suben adjuntos a storage y cuelgan de `order_notes`, estas
 * cuelgan de `complaints_book_note` y distinguen la respuesta enviada.
 *
 * Las notas son internas: solo las ve el equipo. Las que salieron por correo al
 * reclamante quedan en el mismo hilo marcadas, para leer de corrido qué se hizo
 * y qué se le dijo.
 *
 * El alto es fijo para que la caja de escribir no cambie de sitio según cuántas
 * notas haya, y el botón de refrescar está porque otra persona puede dejar una
 * nota con esta pantalla abierta.
 */
const ComplaintNotes = ({
  notes,
  loading,
  saving,
  onRefresh,
  onAddNote,
}: ComplaintNotesProps) => {
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const ok = await onAddNote(trimmed);
    if (ok) setMessage("");
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Notas internas</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            title="Actualizar notas"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <ScrollArea className="h-[340px] pr-4">
          <div className="space-y-3">
            {loading && notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Cargando notas...
              </p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Todavía no hay notas en este reclamo
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-muted p-3 rounded-lg space-y-2 transition-opacity ${
                    loading ? "opacity-60" : ""
                  }`}
                >
                  {note.isReply && (
                    <div className="flex">
                      <Badge variant="info">Respuesta enviada</Badge>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-line">{note.message}</p>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{note.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <ComponentPermission codeIn={["ecommerce_claims.note"]}>
          <div className="flex gap-2">
            <Input
              placeholder="Escribir una nota interna..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={saving}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={saving || message.trim().length === 0}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </ComponentPermission>
      </CardContent>
    </Card>
  );
};

export default ComplaintNotes;
