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
import { Pencil, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MovementRequestListItem } from "../../types/MovementRequestList.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  requests: MovementRequestListItem[];
  loading: boolean;
  userWarehouseId: number | null;
}

const getSituationBadgeColor = (name?: string) => {
  if (name === 'Aprobado' || name === 'Recibido' || name === 'Enviado' || name === 'Completado') return 'bg-green-500 hover:bg-green-500 text-white border-transparent';
  if (name === 'Negociación' || name === 'Solicitado') return 'bg-yellow-500 hover:bg-yellow-500 text-white border-transparent';
  if (name === 'Cancelado') return 'bg-red-500 hover:bg-red-500 text-white border-transparent';
  return 'bg-secondary text-secondary-foreground hover:bg-secondary';
};

export default function MovementRequestsTable({ requests, loading, userWarehouseId }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {loading && requests.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
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
          {loading && requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando solicitudes...
                </div>
              </TableCell>
            </TableRow>
          ) : requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No se encontraron solicitudes de traspaso.
              </TableCell>
            </TableRow>
          ) : (
        requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">#{req.id}</TableCell>
            <TableCell>{req.outWarehouseName}</TableCell>
            <TableCell>{req.inWarehouseName}</TableCell>
            <TableCell>
              <Badge className={getSituationBadgeColor(req.situationName)}>
                {req.situationName}
              </Badge>
            </TableCell>
            <TableCell
              className={`max-w-[300px] ${
                req.lastMessageWarehouseId && req.lastMessageWarehouseId !== userWarehouseId
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : ""
              }`}
            >
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
        )))}
      </TableBody>
    </Table>
    </div>
  );
}
