import { useEffect, useRef, useState } from "react";
import { AlertCircle, Clock, Loader2, Lock, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import { sendMessageApi, uploadAttachmentApi } from "../services/crm.service";
import type { Conversation } from "../types/crm.types";
import {
  ACCEPT,
  formatBytes,
  MAX_CAPTION_LEN,
  MEDIA_ICON,
  mediaTypeOf,
  validateAttachment,
} from "../utils/attachments";

interface Props {
  conversation: Conversation;
  channelId: number | null;
  /** false = bot apagado: nadie atiende el chat mientras ningún asesor lo toma. */
  botEnabled: boolean;
  /** Para traer el mensaje recién enviado sin esperar los 15 s del poll. */
  onSent: () => void;
}

const MAX_LEN = 4096;
/** Cinco líneas de texto: de ahí en más la caja scrollea por dentro. */
const MAX_INPUT_HEIGHT = 120;

/**
 * Caja de respuesta. La regla acordada es que **solo escribe quien tiene el
 * control**, y acá se aplica de la única forma que sirve: cuando no se puede
 * escribir, la caja NO existe. Un textarea deshabilitado invita a escribir y
 * después traga el texto.
 *
 * El bloqueo real vive en sp_crm_send_precheck, del lado del servidor. Esto es
 * la versión amable de la misma regla: explica el motivo y qué hacer.
 */
export const MessageComposer = ({ conversation, channelId, botEnabled, onSent }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const takenByOther = !!conversation.takenBy && !takenByMe;

  // Cambiar de conversación tiene que limpiar el borrador: mandarle a un
  // cliente el texto (o el archivo) que se estaba preparando para otro sería grave.
  useEffect(() => {
    setText("");
    setFile(null);
    setError(null);
  }, [conversation.identity]);

  // Miniatura del archivo elegido. La URL local se libera al cambiarlo.
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ---- Los tres motivos de bloqueo -------------------------------------
  if (takenByOther) {
    return (
      <Blocked tone="warn" icon={<Lock className="h-3.5 w-3.5" />}>
        <strong className="font-medium">
          {conversation.takenByName || "Otro asesor"}
        </strong>{" "}
        tiene el control de esta conversación. Para responder, tienes que
        quitárselo.
      </Blocked>
    );
  }

  if (!conversation.takenBy) {
    return (
      <Blocked icon={<Lock className="h-3.5 w-3.5" />}>
        Toma el control para responder.{" "}
        {conversation.assignedTo
          ? "Está asignada, pero nadie la tiene tomada ahora."
          : botEnabled
            ? "Mientras nadie lo tenga, la atiende el bot."
            : "Nadie está atendiendo este chat."}
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
  // Con un archivo, el texto pasa a ser su pie y WhatsApp lo corta en 1024.
  const maxLen = file ? MAX_CAPTION_LEN : MAX_LEN;
  const tooLong = text.length > maxLen;

  const elegir = (picked: File | null | undefined) => {
    if (!picked) return;
    const problema = validateAttachment(picked);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setFile(picked);
    areaRef.current?.focus();
  };

  const enviar = async () => {
    const limpio = text.trim();
    if ((!limpio && !file) || tooLong || sending || !channelId) return;

    setSending(true);
    setError(null);

    try {
      // El archivo se sube en cada intento: si el envío anterior se rechazó,
      // la edge function ya borró el que había subido.
      const media = file ? await uploadAttachmentApi(channelId, file) : null;

      const result = await sendMessageApi(
        channelId,
        conversation.phoneNumber,
        conversation.whatsappUserId,
        limpio,
        media
      );

      if (!result.success) {
        setError(result.error || "No se pudo enviar el mensaje.");
        return;
      }

      // Solo se limpia la caja si el mensaje realmente salió: si falló, el
      // texto y el archivo siguen ahí para reintentar sin volver a elegirlos.
      setText("");
      setFile(null);
      if (areaRef.current) areaRef.current.style.height = "auto";
      if (result.warning) setError(result.warning);
      onSent();
      areaRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Barra de un chat actual: píldora blanca que crece con el texto y botón
  // redondo de enviar. Enter envía y Shift+Enter salta de línea, como en
  // WhatsApp, así que no hace falta explicarlo debajo.
  return (
    <footer className="border-t bg-muted">
      {error && (
        <p className="flex items-start gap-1.5 bg-destructive-soft px-4 py-1.5 text-[11.5px] text-destructive-soft-foreground">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {file && (
        <AttachmentPreview
          file={file}
          previewUrl={previewUrl}
          disabled={sending}
          onRemove={() => {
            setFile(null);
            setError(null);
          }}
        />
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            elegir(e.target.files?.[0]);
            // Sin esto, elegir de nuevo el mismo archivo no dispara onChange.
            e.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          aria-label="Adjuntar archivo"
          title="Adjuntar foto, video, audio o documento"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-end rounded-3xl border bg-background px-4 py-1.5 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_LEN));
              // Crece hasta cinco líneas y después scrollea por dentro.
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_INPUT_HEIGHT)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            // Pegar una captura (Ctrl+V) la adjunta, como en WhatsApp Web.
            onPaste={(e) => {
              const pasted = e.clipboardData.files?.[0];
              if (pasted) {
                e.preventDefault();
                elegir(pasted);
              }
            }}
            placeholder={file ? "Agrega un comentario (opcional)" : "Escribe un mensaje"}
            rows={1}
            disabled={sending}
            aria-label="Mensaje"
            className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[13.5px] leading-snug outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          {text.length > maxLen - 200 && (
            <span
              className={cn(
                "ml-2 shrink-0 py-1 text-[10.5px] tabular-nums",
                tooLong ? "font-medium text-destructive" : "text-muted-foreground"
              )}
            >
              {maxLen - text.length}
            </span>
          )}
        </div>

        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={enviar}
          disabled={sending || (!text.trim() && !file) || tooLong || !channelId}
          aria-label="Enviar mensaje"
          title={tooLong ? `El texto de un archivo admite ${MAX_CAPTION_LEN} caracteres` : "Enviar"}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </footer>
  );
};

/** El archivo elegido, arriba de la barra: miniatura o ícono, nombre, peso y quitar. */
const AttachmentPreview = ({
  file,
  previewUrl,
  disabled,
  onRemove,
}: {
  file: File;
  previewUrl: string | null;
  disabled: boolean;
  onRemove: () => void;
}) => {
  const Icon = MEDIA_ICON[mediaTypeOf(file)];
  return (
    <div className="px-3 pt-2">
      <div className="flex max-w-md items-center gap-3 rounded-xl border bg-background p-2 shadow-sm">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12.5px] font-medium">{file.name}</span>
          <span className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Quitar archivo"
          title="Quitar archivo"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Pie de conversación cuando NO se puede escribir: dice por qué y qué hacer,
 * en una píldora centrada como los avisos del sistema de WhatsApp.
 */
const Blocked = ({
  children,
  icon,
  tone = "neutral",
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone?: "neutral" | "warn";
}) => (
  <footer className="flex justify-center border-t bg-muted px-4 py-3">
    <p
      className={cn(
        "flex max-w-xl items-start gap-1.5 rounded-2xl border px-4 py-2 text-xs shadow-sm",
        tone === "warn"
          ? "border-transparent bg-destructive-soft text-destructive-soft-foreground"
          : "bg-background text-muted-foreground"
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  </footer>
);
