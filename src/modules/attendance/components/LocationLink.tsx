import { MapPin } from "lucide-react";
import { cn } from "@/shared/utils/utils";

interface LocationLinkProps {
  latitude: number | null;
  longitude: number | null;
  accuracyM?: number | null;
  className?: string;
}

/**
 * Coordenadas de una marca (o del equipo) con su precisión, enlazadas al mapa.
 * No se consulta ningún servicio de direcciones: Google Maps solo se abre si
 * alguien pulsa el enlace. Sin coordenadas no muestra nada.
 */
export const LocationLink = ({ latitude, longitude, accuracyM, className }: LocationLinkProps) => {
  if (latitude === null || longitude === null) return null;
  const precision = accuracyM ? ` · ±${Math.round(accuracyM)} m` : "";
  return (
    <a
      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
      target="_blank"
      rel="noreferrer"
      title="Ver en el mapa"
      className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums hover:underline", className)}
    >
      <MapPin className="w-3.5 h-3.5 shrink-0" />
      {latitude.toFixed(5)}, {longitude.toFixed(5)}
      {precision}
    </a>
  );
};
