import { Eye, Paperclip, Plus } from "lucide-react";
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
import { formatDateDisplay, formatDateTime } from "@/shared/utils/date";
import type { SupportRequestListItem } from "../../types/Support.types";
import { formatSupportCodes } from "../../utils/requestCodes";
import { SupportStatusBadge } from "./SupportStatusBadge";

interface SupportRequestsTableProps {
  requests: SupportRequestListItem[];
  loading: boolean;
  /** Hay algún filtro activo (cambia el copy del estado vacío). */
  hasActiveFilters: boolean;
  onNewRequest: () => void;
  onClearFilters: () => void;
  onViewDetail: (id: string) => void;
}

const SKELETON_ROWS = 5;

export const SupportRequestsTable = ({
  requests,
  loading,
  hasActiveFilters,
  onNewRequest,
  onClearFilters,
  onViewDetail,
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
        {hasActiveFilters ? (
          <>
            <p>No hay solicitudes que cumplan los filtros.</p>
            <Button variant="outline" onClick={onClearFilters}>
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
          <TableHead>Origen</TableHead>
          <TableHead className="text-center">Adjuntos</TableHead>
          <TableHead>Fecha límite</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-medium">{request.title}</p>
                {/* Los códigos por los que se busca la solicitud. Antes aquí
                    solo salía el de la tarea y en crudo ("219"): sin el
                    prefijo y sin el S-n, el usuario no tenía de dónde copiar
                    lo que va a pegar en el buscador. */}
                {formatSupportCodes(request) !== "" && (
                  <p className="text-xs text-muted-foreground">
                    {formatSupportCodes(request)}
                  </p>
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
            <TableCell>
              {request.originHost ? (
                <span className="text-sm">{request.originLabel}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
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
              {/* Estimación de OPOLARITY, no un compromiso. El guion cubre por
                  igual "todavía no es tarea" y "aún sin planificar": no se
                  rotula como "sin fecha límite" para no prometer lo contrario. */}
              {request.dueDate ? (
                <span className="text-sm">{formatDateDisplay(request.dueDate)}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm">{formatDateTime(request.createdAt)}</span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ver detalle de ${request.title}`}
                onClick={() => onViewDetail(request.id)}
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
