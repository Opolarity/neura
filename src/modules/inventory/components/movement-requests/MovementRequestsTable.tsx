import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MovementRequestListItem } from "../../types/MovementRequestList.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  requests: MovementRequestListItem[];
  loading: boolean;
  userWarehouseId: number | null;
}

export default function MovementRequestsTable({ requests, loading, userWarehouseId }: Props) {
  const navigate = useNavigate();
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
          <TableHead>Situación</TableHead>
          <TableHead>Último Mensaje</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">#{req.id}</TableCell>
            <TableCell>{req.outWarehouseName}</TableCell>
            <TableCell>{req.inWarehouseName}</TableCell>
            <TableCell>{req.situationName}</TableCell>
            <TableCell className="max-w-[300px]">
              {req.message ? (
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {req.lastMessageWarehouseName ?? "—"}
                  </span>
                  <p className="truncate text-sm">{req.message}</p>
                </div>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>
              {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/inventory/movement-requests/edit/${req.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
