import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MESSAGE_LENGTH } from "../../types/Support.types";

interface SupportReplyBoxProps {
  sending: boolean;
  /** Devuelve true si el mensaje se envió: solo entonces se limpia el texto. */
  onSend: (content: string) => Promise<boolean>;
}

/** A partir de aquí se muestra el contador: antes solo estorbaría. */
const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 500;

export const SupportReplyBox = ({ sending, onSend }: SupportReplyBoxProps) => {
  const [content, setContent] = useState("");

  const trimmed = content.trim();
  const canSend = trimmed.length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const sent = await onSend(trimmed);
    // En error se conserva lo escrito para no perder el mensaje
    if (sent) setContent("");
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
        disabled={sending}
        className="resize-none"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {content.length >= COUNTER_THRESHOLD
            ? `${content.length} / ${MAX_MESSAGE_LENGTH} caracteres`
            : "El equipo de soporte recibe tu mensaje en la solicitud."}
        </span>
        <Button size="sm" onClick={handleSend} disabled={!canSend}>
          {sending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Responder
        </Button>
      </div>
    </div>
  );
};
