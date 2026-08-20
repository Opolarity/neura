import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AssistantMessage } from "../types";

interface Props {
  messages: AssistantMessage[];
  sending: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
}

/**
 * Un turno del asistente. Codex emite varios mensajes por turno: los primeros
 * son razonamiento ("voy a consultar el esquema...") y el ultimo es la
 * respuesta. Antes se concatenaban y salia un parrafo con las frases pegadas
 * sin espacio; aqui el razonamiento va aparte, atenuado, y la respuesta destaca.
 */
function AssistantTurn({ message }: { message: AssistantMessage }) {
  const bloques = message.blocks.filter((b) => b.trim());
  const pensando = bloques.slice(0, -1);
  const respuesta = bloques.length ? bloques[bloques.length - 1] : "";

  return (
    <div className="flex flex-col gap-2 items-start">
      {pensando.length > 0 && (
        <div className="max-w-[80%] flex flex-col gap-1">
          {pensando.map((paso, i) => (
            <p
              key={i}
              className="text-xs text-muted-foreground whitespace-pre-wrap break-words"
            >
              {paso.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Mientras se transmite, el ultimo bloque puede seguir creciendo: se
          pinta igual, y el spinner solo aparece si aun no llego nada. */}
      {respuesta ? (
        <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
          <p className="whitespace-pre-wrap break-words text-sm">{respuesta.trim()}</p>
        </div>
      ) : (
        message.streaming && (
          <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )
      )}

      {message.streaming && respuesta && (
        <span className="text-xs text-muted-foreground">Pensando...</span>
      )}
    </div>
  );
}

export function ChatThread({ messages, sending, error, onSend, onStop }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // El scroll sigue a la respuesta mientras se transmite: sin esto el texto
  // nuevo crece por debajo del borde visible y parece que no pasa nada.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Escribe abajo para empezar la conversación.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {m.blocks.join("")}
                    </p>
                  </div>
                </div>
              ) : (
                <AssistantTurn key={m.id} message={m} />
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift+Enter salta de linea: es lo que espera
            // cualquiera que haya usado un chat.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Escribe tu mensaje..."
          rows={2}
          className="resize-none"
          disabled={sending}
        />
        {sending ? (
          <Button variant="outline" onClick={onStop} title="Detener respuesta">
            Detener
          </Button>
        ) : (
          <Button onClick={submit} disabled={!draft.trim()} title="Enviar mensaje">
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
