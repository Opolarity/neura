import { useState } from "react";
import { Download } from "lucide-react";
import { VoucherPreviewModal } from "@/modules/sales/components/sales/VoucherPreviewModal";
import { cn } from "@/shared/utils/utils";
import type { MessageMedia as Media } from "../types/crm.types";
import { formatBytes, MEDIA_ICON, mediaPreview } from "../utils/attachments";

/**
 * Imagen dentro de la burbuja. El click abre la vista previa que ya usan los
 * comprobantes de ventas (descargar y abrir en otra pestaña desde ahí), en vez
 * de sacar al asesor del chat. Si no carga, queda el enlace para abrirla.
 */
export const ChatImage = ({ url, small = false }: { url: string; small?: boolean }) => {
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1 inline-block text-xs font-medium underline underline-offset-2"
      >
        Ver imagen
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="mt-1 block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Ver imagen"
      >
        <img
          src={url}
          alt="Imagen enviada en la conversación"
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn(
            "w-auto max-w-full cursor-zoom-in rounded-lg object-contain",
            small ? "max-h-32" : "max-h-64"
          )}
        />
      </button>
      {/* completed: el modal es el de comprobantes; acá no hay pago que confirmar. */}
      <VoucherPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        voucherSrc={url}
        voucherName="imagen"
        title="Imagen del chat"
        completed
      />
    </>
  );
};

/**
 * El archivo de un mensaje, entrante o saliente, dentro de su burbuja. Solo se
 * muestra: el bot no analiza imágenes ni archivos, viajan tal cual.
 *
 * `onPrimary` es la burbuja morada del negocio: la tarjeta del documento usa
 * un tono translúcido del texto en vez del gris, que no se lee sobre el morado.
 */
export const MessageMedia = ({ media, onPrimary }: { media: Media; onPrimary: boolean }) => {
  if (media.type === "image") return <ChatImage url={media.url} />;
  if (media.type === "sticker") return <ChatImage url={media.url} small />;

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        className="mt-1 max-h-72 w-full max-w-sm rounded-lg bg-black"
      />
    );
  }

  if (media.type === "audio" || media.type === "voice") {
    return <audio src={media.url} controls preload="none" className="mt-1 h-10 w-64 max-w-full" />;
  }

  // Documento: tarjeta con nombre, peso y descarga, como en WhatsApp.
  const Icon = MEDIA_ICON.document;
  const size = formatBytes(media.sizeBytes);
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer noopener"
      download={media.fileName ?? undefined}
      className={cn(
        "mt-1 flex min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
        onPrimary ? "bg-primary-foreground/15 hover:bg-primary-foreground/25" : "bg-muted hover:bg-muted/70"
      )}
    >
      <Icon className="h-7 w-7 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12.5px] font-medium">{mediaPreview("document", media.fileName)}</span>
        {size && (
          <span className={cn("text-[10.5px]", onPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {size}
          </span>
        )}
      </span>
      <Download className="h-4 w-4 shrink-0" aria-label="Descargar" />
    </a>
  );
};
