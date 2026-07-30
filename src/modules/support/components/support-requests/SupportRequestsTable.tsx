import { Paperclip, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { formatDateTime } from "@/shared/utils/date";
import type { SupportRequestListItem } from "../../types/Support.types";
import { SupportStatusBadge } from "./SupportStatusBadge";

interface SupportRequestsTableProps {
  requests: SupportRequestListItem[];
  loading: boolean;
  /** Hay un filtro de tipo activo (cambia el copy del estado vacío). */
  filteredByType: boolean;
  onNewRequest: () => void;
  onClearFilter: () => void;
}

const SKELETON_ROWS = 5;

export const SupportRequestsTable = ({
  requests,
  loading,
  filteredByType,
  onNewRequest,
  onClearFilter,
}: SupportRequestsTableProps) => {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        {filteredByType ? (
          <>
            <p>No hay solicitudes de este tipo.</p>
            <Button variant="outline" onClick={onClearFilter}>
              Ver todas
            </Button>
          </>
        ) : (
          <>
            <p>Todavía no hay solicitudes registradas para tu empresa.</p>
            <Button onClick={onNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              Crear la primera solicitud
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Solicitud</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Reportado por</TableHead>
          <TableHead className="text-center">Adjuntos</TableHead>
          <TableHead>Creada</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-medium">{request.title}</p>
                {request.taskCode && (
                  <p className="text-xs text-muted-foreground">{request.taskCode}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={request.requestType === "ticket" ? "default" : "secondary"}>
                {request.requestType === "ticket" ? "Problema" : "Sugerencia"}
              </Badge>
            </TableCell>
            <TableCell>
              <SupportStatusBadge item={request} />
            </TableCell>
            <TableCell>
              {request.reporterName || <span className="text-muted-foreground">-</span>}
            </TableCell>
            <TableCell className="text-center">
              {request.attachmentsCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                  {request.attachmentsCount}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm">{formatDateTime(request.createdAt)}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
