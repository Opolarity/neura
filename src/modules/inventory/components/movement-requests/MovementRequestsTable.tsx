import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MovementRequestListItem } from "../../types/MovementRequestList.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  requests: MovementRequestListItem[];
  loading: boolean;
}

const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const lower = status.toLowerCase();
  if (lower.includes("pendiente")) return "secondary";
  if (lower.includes("aprobado") || lower.includes("completado")) return "default";
  if (lower.includes("rechazado") || lower.includes("cancelado")) return "destructive";
  return "outline";
};

export default function MovementRequestsTable({ requests, loading }: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No se encontraron solicitudes de traspaso.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Almacén Origen</TableHead>
          <TableHead>Almacén Destino</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Situación</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">#{req.id}</TableCell>
            <TableCell>{req.outWarehouseName}</TableCell>
            <TableCell>{req.inWarehouseName}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(req.statusName)}>
                {req.statusName}
              </Badge>
            </TableCell>
            <TableCell>{req.situationName}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {req.message || "—"}
            </TableCell>
            <TableCell>
              {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
