/**
 * Pinta el HTML que llega de OPOLARITY (descripción de una solicitud, o el
 * protocolo de respuestas de tickets).
 *
 * Los estilos van como variantes sobre el contenedor y no como clases dentro
 * del HTML: ese HTML lo escriben en OPOLARITY y lo muestran cuatro sistemas
 * distintos, así que no puede traer estilos propios. Todos los colores salen
 * de tokens semánticos (`border`, `muted-foreground`) para que funcione igual
 * en claro y en oscuro; un hex fijo aquí rompería uno de los dos temas.
 */
import { sanitizeSupportHtml } from "../../utils/sanitizeSupportHtml";

const PROSE = [
  "text-sm leading-relaxed",
  "[&_a]:underline [&_img]:max-w-full [&_img]:rounded",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_ul]:space-y-1 [&_ol]:space-y-1",
  "[&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3",
  "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2",
  "[&_strong]:font-medium [&_strong]:text-foreground",
  // Las tablas del protocolo: sin esto salen sin bordes y pegadas.
  "[&_table]:w-full [&_table]:text-xs [&_table]:my-3 [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-foreground",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
  // Los avisos del texto vienen como blockquote (nunca con color inline).
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3",
  "[&_blockquote]:text-xs [&_blockquote]:my-3",
].join(" ");

interface SupportRichTextProps {
  html: string | null;
  className?: string;
}

export const SupportRichText = ({ html, className }: SupportRichTextProps) => {
  if (!html) return null;

  return (
    <div
      className={`${PROSE} text-muted-foreground ${className ?? ""}`}
      // Sanea en sanitizeSupportHtml: el contenido da la vuelta por un servicio
      // externo antes de llegar acá.
      dangerouslySetInnerHTML={{ __html: sanitizeSupportHtml(html) }}
    />
  );
};
