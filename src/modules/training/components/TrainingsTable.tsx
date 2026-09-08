import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TrainingBooking, TrainingScope } from "../types/Training.types";
import { formatTrainingDateTime } from "../utils/formatTraining";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

interface TrainingsTableProps {
  bookings: TrainingBooking[];
  loading: boolean;
  scope: TrainingScope;
  onSchedule: () => void;
  onViewDetail: (booking: TrainingBooking) => void;
}

const SKELETON_ROWS = 5;

const EMPTY_COPY: Record<TrainingScope, string> = {
  upcoming: "No tienes capacitaciones agendadas.",
  past: "Todavía no has tenido capacitaciones.",
  cancelled: "No hay capacitaciones canceladas.",
};

export const TrainingsTable = ({
  bookings,
  loading,
  scope,
  onSchedule,
  onViewDetail,
}: TrainingsTableProps) => {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <p>{EMPTY_COPY[scope]}</p>
        {scope === "upcoming" && (
          <Button onClick={onSchedule}>
            <Plus className="w-4 h-4 mr-2" />
            Agendar la primera
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Capacitación</TableHead>
          <TableHead>Capacitador</TableHead>
          <TableHead>Fecha y hora</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.title}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{booking.hostName}</span>
                {booking.hostJobTitle && (
                  <span className="text-xs text-muted-foreground">
                    {booking.hostJobTitle}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>{formatTrainingDateTime(booking.startsAt)}</TableCell>
            <TableCell>
              <TrainingStatusBadge booking={booking} />
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                title="Ver detalle de la capacitación"
                aria-label="Ver detalle"
                onClick={() => onViewDetail(booking)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
