import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Bot, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/utils/utils";
import type { ConversationMessage } from "../types/crm.types";

interface Props {
  messages: ConversationMessage[];
  loading: boolean;
}

/**
 * Las imágenes viajan dentro del texto, con la convención que ya usa el bot:
 * `[El cliente envió una imagen ... URL: https://...]`. Se extrae para poder
 * mostrarla como enlace en vez de volcar la URL cruda en la burbuja.
 */
const extractImageUrl = (message: string): string | null => {
  const match = message.match(/URL:\s*(https?:\/\/\S+?)(?:\s|\]|$)/i);
  return match ? match[1] : null;
};

const dayLabel = (iso: string) => {
  try {
    return format(new Date(iso), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return "";
  }
};

const timeLabel = (iso: string) => {
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "";
  }
};

export const ConversationThread = ({ messages, loading }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Al abrir una conversación interesa lo último, no lo primero.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!loading && messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Esta conversación no tiene mensajes.</p>
      </div>
    );
  }

  let lastDay = "";

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 px-6 py-4">
        {messages.map((m) => {
          const mine = m.author === "business";
          const isBot = m.author === "bot";
          const day = dayLabel(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          const imageUrl = extractImageUrl(m.message);

          return (
            <div key={m.id} className="flex flex-col gap-3">
              {showDay && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              <div
                className={cn(
                  "flex w-full",
                  mine || isBot ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    // El asesor y el bot van del mismo lado —los dos son "el
                    // negocio"— pero con distinto color: al revisar un hilo hay
                    // que poder distinguir de un vistazo qué contestó una
                    // persona y qué contestó el bot.
                    mine && "bg-primary text-primary-foreground",
                    isBot && "bg-secondary text-secondary-foreground",
                    !mine && !isBot && "bg-muted text-foreground"
                  )}
                >
                  {isBot && (
                    <span className="mb-1 flex items-center gap-1 text-xs opacity-70">
                      <Bot className="h-3 w-3" />
                      Bot
                    </span>
                  )}

                  <p className="whitespace-pre-wrap break-words">{m.message}</p>

                  {imageUrl && (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-block text-xs font-medium underline underline-offset-2"
                    >
                      Ver imagen
                    </a>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-[11px] opacity-70">
                    <span className="tabular-nums">{timeLabel(m.createdAt)}</span>

                    {m.deliveryStatus === "failed" && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        No entregado
                        {m.deliveryErrorCode ? ` (${m.deliveryErrorCode})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
