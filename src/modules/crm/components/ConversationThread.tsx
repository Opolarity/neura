import { useEffect, useRef } from "react";
import { formatDateLong, formatTime } from "@/shared/utils/date";
import { AlertCircle, Bot, MessageSquare } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { ConversationMessage } from "../types/crm.types";
import { isMediaMarker } from "../utils/attachments";
import { ChatImage, MessageMedia } from "./MessageMedia";

interface Props {
  messages: ConversationMessage[];
  loading: boolean;
}

/**
 * Formato viejo, anterior a las columnas media_*: la imagen viajaba dentro del
 * texto con la convención del bot `[El cliente envió una imagen ... URL:
 * https://...]`. Se sigue entendiendo para los mensajes que quedaron así.
 */
const IMAGE_BLOCK = /\[[^\]]*URL:\s*https?:\/\/[^\]]*\]/gi;

const extractImageUrl = (message: string): string | null => {
  const match = message.match(/URL:\s*(https?:\/\/\S+?)(?:\s|\]|$)/i);
  return match ? match[1] : null;
};

/** El bloque `[... URL: ...]` es metadata del bot: no debe verse en el chat. */
const stripImageBlock = (message: string): string =>
  message.replace(IMAGE_BLOCK, "").replace(/\n{3,}/g, "\n\n").trim();

// El separador de dia y la hora de cada mensaje se resuelven en Lima con los
// helpers de shared/utils/date. Con `format()` de date-fns pelado se pintaban
// en el huso del navegador: un mensaje de las 21:00 de Lima aparecia bajo el
// separador del dia siguiente en cuanto el ERP se abria desde Europa, y la
// hora tampoco era la que vio el vendedor.
const dayLabel = (iso: string) => formatDateLong(iso);

const timeLabel = (iso: string) => formatTime(iso);

export const ConversationThread = ({ messages, loading }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Al abrir una conversación interesa lo último, no lo primero.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!loading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        {/* En tarjeta: sobre el patrón del fondo, el texto suelto se pierde. */}
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-background px-6 py-5 text-center shadow-sm">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Esta conversación no tiene mensajes.</p>
        </div>
      </div>
    );
  }

  let lastDay = "";

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col gap-2 px-6 py-5">
        {messages.map((m) => {
          const mine = m.author === "business";
          const isBot = m.author === "bot";
          const day = dayLabel(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          // Con el archivo en media, el bloque viejo y el marcador "[imagen]"
          // que se guarda cuando va sin texto sobran: solo queda el pie.
          const imageUrl = m.media ? null : extractImageUrl(m.message);
          const clean = m.media || imageUrl ? stripImageBlock(m.message) : m.message;
          const text = m.media && isMediaMarker(clean) ? "" : clean;

          return (
            <div key={m.id} className="flex flex-col gap-2">
              {/* El día va en una píldora, como el "Hoy" de WhatsApp: una línea
                  y texto gris sueltos se pierden sobre el patrón del fondo. */}
              {showDay && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-chat-border px-3 py-1 text-[11px] text-chat-foreground shadow-sm">
                    {day}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "flex w-full min-w-0",
                  mine || isBot ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "min-w-0 max-w-[68%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm",
                    // El asesor y el bot son "el negocio": mismo lado y mismo
                    // morado de marca. Lo que contestó el bot se distingue por
                    // su etiqueta. El cliente va en blanco, que es lo que se lee
                    // sobre el fondo oscuro.
                    (mine || isBot) && "bg-primary text-primary-foreground",
                    !mine && !isBot && "bg-background text-foreground"
                  )}
                >
                  {isBot && (
                    <span className="mb-1 flex items-center gap-1 text-[10.5px] text-primary-foreground/80">
                      <Bot className="h-3 w-3" />
                      Bot
                    </span>
                  )}

                  {/* El archivo arriba y su texto debajo, como el pie de foto de WhatsApp. */}
                  {m.media && <MessageMedia media={m.media} onPrimary={mine || isBot} />}

                  {text && <p className={cn("whitespace-pre-wrap break-words", m.media && "mt-1")}>{text}</p>}

                  {imageUrl && <ChatImage url={imageUrl} />}

                  {/* Hora y acuse abajo a la derecha, como en WhatsApp, con el
                      tono suave que corresponde a cada burbuja. */}
                  <div
                    className={cn(
                      "mt-0.5 flex items-center justify-end gap-2 text-[10px]",
                      mine || isBot ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
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
    </div>
  );
};
