import {
  Barcode,
  File,
  ImageIcon,
  QrCode,
  Square,
  Table,
  Type,
  type LucideIcon,
} from "lucide-react";

/**
 * El icono de cada componente de la hoja, por su nombre (displayName): el
 * mismo en la barra de Componentes y en la Estructura. Un componente nuevo
 * suma aquí el suyo.
 */
export const COMPONENT_ICONS: Record<string, LucideIcon> = {
  Contenedor: Square,
  Texto: Type,
  "Tabla de datos": Table,
  Imagen: ImageIcon,
  QR: QrCode,
  "Código de barras": Barcode,
};

/** La Hoja es un Contenedor, pero se distingue con su propio icono. */
export const PAGE_ICON: LucideIcon = File;
