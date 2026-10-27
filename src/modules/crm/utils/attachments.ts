import { FileText, Film, Image, Mic, Music, Sticker, type LucideIcon } from "lucide-react";
import type { MessageMediaType, OutgoingMedia } from "../types/crm.types";

/*
 * Reglas de los adjuntos que salen desde Chats. Son las de WhatsApp Cloud API,
 * validadas antes de subir para dar un error entendible en vez del rechazo de
 * Meta después de la espera. El servidor (crm-send-message y el bot) vuelve a
 * validar: esto es solo la versión amable.
 */

const MB = 1024 * 1024;

type OutgoingType = OutgoingMedia["type"];

/** WhatsApp solo acepta JPG y PNG como imagen; otro formato viaja como documento. */
const IMAGE_MIMES = ["image/jpeg", "image/png"];
const VIDEO_MIMES = ["video/mp4", "video/3gpp"];
const AUDIO_MIMES = ["audio/aac", "audio/amr", "audio/mpeg", "audio/mp4", "audio/ogg"];

/** Topes de Meta por tipo. El documento va al mismo tope que los entrantes (chbot-upload-media). */
export const MAX_BYTES: Record<OutgoingType, number> = {
  image: 5 * MB,
  video: 16 * MB,
  audio: 16 * MB,
  sticker: 0.5 * MB,
  document: 25 * MB,
};

/** Lo que muestra el selector de archivos. Cualquier otro archivo entra como documento. */
export const ACCEPT =
  "image/*,video/mp4,video/3gpp,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

/** Tope de WhatsApp para el texto que acompaña a un archivo. */
export const MAX_CAPTION_LEN = 1024;

const mimeOf = (file: File) => file.type.split(";")[0].trim().toLowerCase();

/** Cómo se manda cada archivo por WhatsApp. */
export const mediaTypeOf = (file: File): OutgoingType => {
  const mime = mimeOf(file);
  if (IMAGE_MIMES.includes(mime)) return "image";
  if (VIDEO_MIMES.includes(mime)) return "video";
  if (AUDIO_MIMES.includes(mime)) return "audio";
  return "document";
};

/** null si el archivo se puede mandar; si no, el motivo para el asesor. */
export const validateAttachment = (file: File): string | null => {
  if (file.size === 0) return "El archivo está vacío.";
  const type = mediaTypeOf(file);
  if (file.size > MAX_BYTES[type]) {
    return `${MEDIA_LABEL[type]} supera los ${formatBytes(MAX_BYTES[type])} que admite WhatsApp.`;
  }
  return null;
};

export const formatBytes = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
};

/** Extensión para la ruta en el bucket: la del nombre, o la del mime si no tiene. */
export const extensionOf = (file: File): string => {
  const fromName = file.name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  if (fromName) return fromName[1];
  const sub = mimeOf(file).split("/")[1] ?? "";
  return /^[a-z0-9]{1,8}$/.test(sub) ? sub : "bin";
};

export const MEDIA_LABEL: Record<MessageMediaType, string> = {
  image: "La imagen",
  video: "El video",
  audio: "El audio",
  voice: "La nota de voz",
  sticker: "El sticker",
  document: "El documento",
};

export const MEDIA_ICON: Record<MessageMediaType, LucideIcon> = {
  image: Image,
  video: Film,
  audio: Music,
  voice: Mic,
  sticker: Sticker,
  document: FileText,
};

/** Cómo se nombra el archivo en la vista previa de la lista de chats. */
export const mediaPreview = (type: MessageMediaType, fileName: string | null): string => {
  if (type === "image") return "Foto";
  if (type === "video") return "Video";
  if (type === "audio") return "Audio";
  if (type === "voice") return "Nota de voz";
  if (type === "sticker") return "Sticker";
  return fileName || "Documento";
};

/**
 * Los marcadores que se guardan como texto cuando el archivo va sin texto
 * (crm-send-message y el bot). Con el archivo a la vista, repetirlos sobra.
 */
const MARKER = /^\[(imagen|image|video|audio|nota de voz|sticker|documento[^\]]*)\]$/i;

export const isMediaMarker = (text: string): boolean => MARKER.test(text.trim());
