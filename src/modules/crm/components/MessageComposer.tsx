import { useEffect, useRef, useState } from "react";
import { AlertCircle, Clock, Loader2, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import { sendMessageApi } from "../services/crm.service";
import type { Conversation } from "../types/crm.types";

interface Props {
  conversation: Conversation;
  channelId: number | null;
  /** Para traer el mensaje recién enviado sin esperar los 15 s del poll. */
  onSent: () => void;
}

const MAX_LEN = 4096;

/**
 * Caja de respuesta. La regla acordada es que **solo escribe quien tiene el
 * control**, y acá se aplica de la única forma que sirve: cuando no se puede
 * escribir, la caja NO existe. Un textarea deshabilitado invita a escribir y
 * después traga el texto.
 *
 * El bloqueo real vive en sp_crm_send_precheck, del lado del servidor. Esto es
 * la versión amable de la misma regla: explica el motivo y qué hacer.
 */
export const MessageComposer = ({ conversation, channelId, onSent }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const takenByOther = !!conversation.takenBy && !takenByMe;

  // Cambiar de conversación tiene que limpiar el borrador: mandarle a un
  // cliente el texto que se estaba escribiendo para otro sería grave.
  useEffect(() => {
    setText("");
    setError(null);
  }, [conversation.identity]);

  // ---- Los tres motivos de bloqueo -------------------------------------
  if (takenByOther) {
    return (
      <Blocked tone="warn" icon={<Lock className="h-3.5 w-3.5" />}>
        <strong className="font-medium">
          {conversation.takenByName || "Otro asesor"}
        </strong>{" "}
        tiene el control de esta conversación. Para responder, tenés que
        quitárselo.
      </Blocked>
    );
  }

  if (!conversation.takenBy) {
    return (
      <Blocked icon={<Lock className="h-3.5 w-3.5" />}>
        Tomá el control para responder.{" "}
        {conversation.assignedTo
          ? "Está asignada, pero nadie la tiene tomada ahora."
          : "Mientras nadie lo tenga, la atiende el bot."}
      </Blocked>
    );
  }

  if (!conversation.windowOpen) {
    return (
      <Blocked tone="warn" icon={<Clock className="h-3.5 w-3.5" />}>
        Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo
        permite plantillas aprobadas fuera de ese plazo, y todavía no hay
        ninguna cargada.
      </Blocked>
    );
  }

  // ---- Se puede escribir ------------------------------------------------
  const enviar = async () => {
    const limpio = text.trim();
    if (!limpio || sending || !channelId) return;

    setSending(true);
    setError(null);

    try {
      const result = await sendMessageApi(
        channelId,
        conversation.phoneNumber,
        conversation.whatsappUserId,
        limpio
      );

      if (!result.success) {
        setError(result.error || "No se pudo enviar el mensaje.");
        return;
      }

      // Solo se limpia la caja si el mensaje realmente salió: si falló, el
      // texto sigue ahí para reintentar sin volver a escribirlo.
      setText("");
      if (result.warning) setError(result.warning);
      onSent();
      areaRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="border-t bg-muted/40 px-4 py-2">
      {error && (
        <p className="mb-1.5 flex items-start gap-1 text-[11px] text-destructive-soft-foreground">
          <AlertCircle className="mt-px h-3 w-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            // Enter envía y Shift+Enter hace salto de línea, como en cualquier
            // chat. Es la costumbre de quien vive en WhatsApp todo el día.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Escribí tu respuesta…"
          rows={1}
          disabled={sending}
          className="max-h-32 min-h-[36px] resize-none py-2 text-[13px]"
        />

        <Button
          size="sm"
          className="h-9 shrink-0 px-3"
          onClick={enviar}
          disabled={sending || !text.trim() || !channelId}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="mt-1 text-[10.5px] text-muted-foreground">
        Enter envía · Shift+Enter salta de línea
        {text.length > MAX_LEN - 200 && ` · ${MAX_LEN - text.length} caracteres`}
      </p>
    </footer>
  );
};

/** Pie de conversación cuando NO se puede escribir: dice por qué y qué hacer. */
const Blocked = ({
  children,
  icon,
  tone = "neutral",
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone?: "neutral" | "warn";
}) => (
  <footer className="border-t bg-muted/40 px-4 py-2.5">
    <p
      className={cn(
        "flex items-start gap-1.5 text-xs",
        tone === "warn" ? "text-destructive-soft-foreground" : "text-muted-foreground"
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  </footer>
);
