import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { formatDateLong, formatDateTime, formatTime } from "@/shared/utils/date";
import type { SupportAttachmentFile, SupportMessage } from "../../types/Support.types";
import { SupportAttachmentLink } from "./SupportAttachmentLink";

interface SupportConversationProps {
  messages: SupportMessage[];
  /** Falló la última recarga silenciosa: se avisa sin vaciar el hilo. */
  refreshError?: boolean;
  onRetryMessage: (localId: string) => void;
  onDiscardMessage: (localId: string) => void;
}

/**
 * Texto de los eventos automáticos. El conjunto es abierto: un `event` que no
 * esté aquí cae al `content` que manda la API, que ya viene redactado.
 */
const EVENT_LABEL: Record<string, string> = {
  approved: "La solicitud fue aprobada y convertida en tarea.",
  rejected: "La solicitud fue revisada y descartada.",
};

/** Mensajes seguidos del mismo autor dentro de este margen van agrupados. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
/** A menos de esto del fondo se considera que el usuario está "al día". */
const BOTTOM_THRESHOLD_PX = 120;
/** Desde aquí aparece el botón para bajar al último mensaje. */
const JUMP_BUTTON_THRESHOLD_PX = 400;

// Saltos de línea largos (URLs, palabras sin espacios) siempre bajan de línea:
// sin `overflow-wrap:anywhere` una URL de 300 caracteres empuja la burbuja y
// el panel entero gana scroll horizontal.
const WRAP = "whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

/**
 * El contenido es TEXTO PLANO: nunca se inserta como HTML. Las URLs se
 * convierten en enlaces armados como elementos de React.
 */
const LinkifiedText = ({ text }: { text: string }) => {
  const parts = text.split(URL_RE);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        // El punto o el paréntesis que cierra la frase no son parte del enlace
        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 [overflow-wrap:anywhere] hover:opacity-80"
            >
              {href}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
};

const isImage = (file: SupportAttachmentFile) =>
  (file.mimeType ?? "").toLowerCase().startsWith("image/");

/**
 * Miniatura de un adjunto de imagen. Mientras carga reserva alto para que el
 * hilo no salte; si no carga, cae al enlace de descarga de siempre.
 */
const ChatImage = ({
  file,
  onLoad,
}: {
  file: SupportAttachmentFile;
  onLoad: () => void;
}) => {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  // Se avisa con el tamaño final ya en el DOM y antes de pintar: así el hilo
  // se re-ancla al fondo en el mismo frame, sin salto visible.
  useLayoutEffect(() => {
    if (state !== "loading") onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === "failed") return <SupportAttachmentLink file={file} />;

  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={file.fileName}
      className="block max-w-full overflow-hidden rounded-md border bg-muted/40"
    >
      {/* Mientras carga, la imagen ocupa un cuadro fijo: con 0×0 el navegador
          puede no disparar la carga diferida y el hilo saltaría al aparecer */}
      <img
        src={file.fileUrl}
        alt={file.fileName}
        loading="lazy"
        onLoad={() => setState("ready")}
        onError={() => setState("failed")}
        className={cn(
          "block max-w-full object-contain",
          state === "loading" ? "h-24 w-24" : "h-auto max-h-64 w-auto",
        )}
      />
    </a>
  );
};

const SystemLine = ({ message }: { message: SupportMessage }) => (
  <div className="flex justify-center py-1">
    <span
      className={cn(
        "max-w-[90%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground",
        "[overflow-wrap:anywhere]",
      )}
    >
      {(message.event && EVENT_LABEL[message.event]) || message.content}
      <span className="ml-2 whitespace-nowrap opacity-70">
        {formatDateTime(message.createdAt)}
      </span>
    </span>
  </div>
);

const DeliveryFooter = ({
  message,
  onRetry,
  onDiscard,
}: {
  message: SupportMessage;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
}) => {
  const delivery = message.delivery;
  if (!delivery || delivery.status !== "failed") return null;

  return (
    <div className="flex max-w-full flex-col items-end gap-0.5 text-[11px]">
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
        <span className="flex items-center gap-1 text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          No se envió
        </span>
        <button
          type="button"
          onClick={() => onRetry(delivery.localId)}
          disabled={delivery.verifying}
          className="flex items-center gap-1 font-medium text-foreground hover:underline disabled:opacity-60 disabled:no-underline"
        >
          {delivery.verifying ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Verificando…
            </>
          ) : (
            <>
              <RotateCcw className="h-3 w-3" />
              Reintentar
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onDiscard(delivery.localId)}
          disabled={delivery.verifying}
          className="text-muted-foreground hover:text-destructive hover:underline disabled:opacity-60"
        >
          Descartar
        </button>
      </div>
      {delivery.failureKind === "ambiguous" && (
        <span className="text-right text-muted-foreground">
          Puede que ya haya llegado: lo comprobamos antes de reenviarlo.
        </span>
      )}
    </div>
  );
};

interface MessageBubbleProps {
  message: SupportMessage;
  showAuthor: boolean;
  onMediaLoad: () => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
}

const MessageBubble = ({
  message,
  showAuthor,
  onMediaLoad,
  onRetry,
  onDiscard,
}: MessageBubbleProps) => {
  const isOwn = message.origin === "external";
  const delivery = message.delivery;
  const sending = delivery?.status === "sending";
  const failed = delivery?.status === "failed";
  const images = message.attachments.filter(isImage);
  const files = message.attachments.filter((file) => !isImage(file));

  return (
    <div className={cn("flex w-full min-w-0", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[75%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {showAuthor && (
          <span className="max-w-full truncate px-1 text-xs font-medium text-foreground">
            {message.authorName || (isOwn ? "Tú" : "Equipo OPOLARITY")}
          </span>
        )}

        {message.content && (
          <div
            className={cn(
              "w-fit min-w-0 max-w-full rounded-2xl px-3 py-2 text-sm leading-relaxed",
              isOwn ? "rounded-br-md bg-primary/10" : "rounded-bl-md bg-muted",
              failed && "ring-1 ring-destructive/40",
              sending && "opacity-70",
            )}
          >
            {/* content es TEXTO PLANO: se respetan los saltos de línea y nunca
                se inserta como HTML (a diferencia de la descripción) */}
            <p className={WRAP}>
              <LinkifiedText text={message.content} />
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 text-[11px] text-muted-foreground tabular-nums">
              {sending && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Enviando…
                </span>
              )}
              <span>{formatTime(message.createdAt)}</span>
            </div>
          </div>
        )}

        {/* Adjuntos del envío optimista: aún no tienen URL del servidor */}
        {delivery && delivery.files.length > 0 && (
          <ul className={cn("flex max-w-full flex-col gap-1", isOwn ? "items-end" : "items-start", sending && "opacity-70")}>
            {delivery.files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="min-w-0 max-w-full">
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    onLoad={onMediaLoad}
                    className="block h-auto max-h-40 w-auto max-w-full rounded-md border object-contain"
                  />
                ) : (
                  <span className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {images.length > 0 && (
          <ul className={cn("flex max-w-full flex-col gap-1", isOwn ? "items-end" : "items-start")}>
            {images.map((file) => (
              <li key={file.id} className="min-w-0 max-w-full">
                <ChatImage file={file} onLoad={onMediaLoad} />
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <ul className="flex w-full min-w-0 flex-col gap-1">
            {files.map((file) => (
              <li key={file.id} className="min-w-0 max-w-full">
                <SupportAttachmentLink file={file} />
              </li>
            ))}
          </ul>
        )}

        {/* Mensaje sin texto (solo adjuntos): la hora va suelta debajo */}
        {!message.content && (
          <span className="px-1 text-[11px] text-muted-foreground tabular-nums">
            {formatTime(message.createdAt)}
          </span>
        )}

        <DeliveryFooter message={message} onRetry={onRetry} onDiscard={onDiscard} />
      </div>
    </div>
  );
};

/** Clave del lado y autor: dos mensajes con la misma clave pueden agruparse. */
const authorKey = (message: SupportMessage) =>
  `${message.origin}|${message.authorName ?? ""}`;

/**
 * Hilo de la solicitud como chat: separadores por día (hora de Lima), mensajes
 * agrupados por autor, adjuntos dentro del ancho de la burbuja y un scroll que
 * solo se mueve solo si el usuario ya estaba al día.
 */
export const SupportConversation = ({
  messages,
  refreshError = false,
  onRetryMessage,
  onDiscardMessage,
}: SupportConversationProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    if (behavior !== "smooth") lastScrollTopRef.current = el.scrollTop;
    setHasUnseen(false);
    setShowJump(false);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUp = el.scrollTop < lastScrollTopRef.current - 1;
    lastScrollTopRef.current = el.scrollTop;

    // Solo un scroll HACIA ARRIBA despega del fondo. Si el contenido creció
    // (una imagen terminó de cargar) entre un ajuste y este evento, la
    // distancia sube sin que el usuario se haya movido: eso no cuenta.
    if (distance < BOTTOM_THRESHOLD_PX) atBottomRef.current = true;
    else if (scrolledUp) atBottomRef.current = false;

    setShowJump(distance > JUMP_BUTTON_THRESHOLD_PX);
    if (atBottomRef.current) setHasUnseen(false);
  };

  /** Una imagen que termina de cargar no debe dejar el último mensaje tapado. */
  const handleMediaLoad = useCallback(() => {
    if (atBottomRef.current) scrollToBottom();
  }, [scrollToBottom]);

  // Llegó o se envió algo: si el usuario estaba al día (o el mensaje es suyo)
  // se baja; si estaba leyendo arriba, no se le mueve nada y se avisa.
  useLayoutEffect(() => {
    const last = messages[messages.length - 1];
    const lastId = last?.id ?? null;
    const previousId = lastMessageIdRef.current;
    lastMessageIdRef.current = lastId;

    if (previousId === null) {
      // Primer pintado de la pestaña: se entra por el último mensaje
      scrollToBottom();
      return;
    }
    if (lastId === previousId || !last) return;

    const isOwnNew = last.origin === "external" && !!last.delivery;
    if (atBottomRef.current || isOwnNew) {
      scrollToBottom();
    } else {
      setHasUnseen(true);
    }
  }, [messages, scrollToBottom]);

  // Si cambia el alto del hilo o del panel (la caja de respuesta crece, carga
  // una imagen) y el usuario estaba al día, se mantiene pegado al fondo.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
        lastScrollTopRef.current = scrollEl.scrollTop;
      }
    });
    observer.observe(scrollEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  let lastDay = "";
  let previous: SupportMessage | null = null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {refreshError && (
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">
            No se pudo actualizar la conversación. Lo volvemos a intentar en unos segundos.
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-chat-scroll
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [overflow-anchor:none]"
      >
        <div
          ref={contentRef}
          role="log"
          aria-live="polite"
          aria-label="Conversación con el equipo de soporte"
          className="flex min-h-full min-w-0 flex-col gap-1 px-4 py-4 sm:px-6"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Aún no hay mensajes. Escribe para iniciar la conversación con el equipo
                de soporte.
              </p>
            </div>
          ) : (
            // El hilo arranca abajo, como en cualquier chat, si es corto
            <div className="mt-auto flex min-w-0 flex-col">
              {messages.map((message) => {
                const day = formatDateLong(message.createdAt);
                const showDay = day !== lastDay;
                lastDay = day;

                const isSystem = message.origin === "system";
                const grouped =
                  !showDay &&
                  !isSystem &&
                  previous !== null &&
                  previous.origin !== "system" &&
                  authorKey(previous) === authorKey(message) &&
                  Date.parse(message.createdAt) - Date.parse(previous.createdAt) <
                    GROUP_WINDOW_MS;
                previous = message;

                return (
                  <div
                    key={message.delivery?.localId ?? message.id}
                    className={cn("min-w-0", grouped ? "mt-1" : "mt-3 first:mt-0")}
                  >
                    {showDay && (
                      <div className="flex items-center gap-3 pb-2 pt-1">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="shrink-0 text-xs text-muted-foreground">{day}</span>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>
                    )}
                    {isSystem ? (
                      <SystemLine message={message} />
                    ) : (
                      <MessageBubble
                        message={message}
                        showAuthor={!grouped}
                        onMediaLoad={handleMediaLoad}
                        onRetry={onRetryMessage}
                        onDiscard={onDiscardMessage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(hasUnseen || showJump) && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className={cn(
            "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5",
            "text-xs font-medium text-foreground shadow-md hover:bg-muted",
          )}
          aria-label={hasUnseen ? "Ver mensajes nuevos" : "Ir al último mensaje"}
        >
          <ArrowDown className="h-3.5 w-3.5" />
          {hasUnseen ? "Nuevos mensajes" : "Ir al último"}
        </button>
      )}
    </div>
  );
};
