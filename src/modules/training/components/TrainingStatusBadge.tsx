import { Badge } from "@/components/ui/badge";
import type { TrainingBooking } from "../types/Training.types";

/**
 * Estado → variante, nunca clases de color. Una capacitación 'confirmed' que
 * ya terminó no es lo mismo que una que está por venir, así que se distinguen
 * aunque compartan estado en la API.
 */
export const TrainingStatusBadge = ({ booking }: { booking: TrainingBooking }) => {
  if (booking.status === "cancelled") {
    return <Badge variant="destructive-soft">Cancelada</Badge>;
  }
  if (booking.status === "confirmed") {
    return booking.isPast
      ? <Badge variant="pending">Realizada</Badge>
      : <Badge variant="success">Agendada</Badge>;
  }
  return <Badge variant="outline">Sin estado</Badge>;
};
