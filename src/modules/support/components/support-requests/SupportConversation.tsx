import { useEffect, useRef } from "react";
import { cn } from "@/shared/utils/utils";
import { formatDateTime } from "@/shared/utils/date";
import type { SupportMessage } from "../../types/Support.types";
import { SupportAttachmentLink } from "./SupportAttachmentLink";

interface SupportConversationProps {
  messages: SupportMessage[];
}

/**
 * Texto de los eventos automáticos. El conjunto es abierto: un `event` que no
 * esté aquí cae al `content` que manda la API, que ya viene redactado.
 */
const EVENT_LABEL: Record<string, string> = {
  approved: "La solicitud fue aprobada y convertida en tarea.",
  rejected: "La solicitud fue revisada y descartada.",
};

const SystemLine = ({ message }: { message: SupportMessage }) => (
  <div className="flex justify-center py-1">
    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground text-center">
      {(message.event && EVENT_LABEL[message.event]) || message.content}
      <span className="ml-2 opacity-70">{formatDateTime(message.createdAt)}</span>
    </span>
  </div>
);

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  const isOwn = message.origin === "external";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] space-y-1", isOwn && "items-end")}>
        <div
          className={cn(
            "flex items-baseline gap-2 text-xs text-muted-foreground",
            isOwn && "justify-end",
          )}
        >
          <span className="font-medium text-foreground">
            {message.authorName || (isOwn ? "Tú" : "Equipo OPOLARITY")}
          </span>
          <span>{formatDateTime(message.createdAt)}</span>
        </div>

        {message.content && (
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm leading-relaxed",
              // content es TEXTO PLANO: se respetan los saltos de línea y nunca
              // se inserta como HTML (a diferencia de la descripción)
              "whitespace-pre-wrap break-words",
              isOwn ? "bg-primary/10" : "bg-muted",
            )}
          >
            {message.content}
          </div>
        )}

        {message.attachments.length > 0 && (
          <ul className="space-y-1">
            {message.attachments.map((file) => (
              <li key={file.id}>
                <SupportAttachmentLink file={file} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const SupportConversation = ({ messages }: SupportConversationProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  const previousCount = useRef(messages.length);

  // Solo al llegar un mensaje nuevo: al abrir, el panel se queda arriba para que
  // se lea primero la solicitud, no el final del hilo.
  useEffect(() => {
    if (messages.length > previousCount.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    previousCount.current = messages.length;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay mensajes. Escribe para iniciar la conversación con el equipo de
        soporte.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) =>
        message.origin === "system" ? (
          <SystemLine key={message.id} message={message} />
        ) : (
          <MessageBubble key={message.id} message={message} />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
};
