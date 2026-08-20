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
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                      : "max-w-[80%] rounded-lg bg-muted px-4 py-2"
                  }
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {m.text}
                    {m.streaming && !m.text && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </p>
                </div>
              </div>
            ))}
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
