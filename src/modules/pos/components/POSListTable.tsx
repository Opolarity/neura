import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye } from "lucide-react";
import type { POSSessionListItem } from "../types/POSList.types";
import { formatCurrency, formatTime } from "@/modules/sales/adapters/POS.adapter";
import POSSessionDetailDialog from "./POSSessionDetailDialog";

interface POSListTableProps {
  sessions: POSSessionListItem[];
  loading: boolean;
  search: string;
}

const POSListTable = ({ sessions, loading, search }: POSListTableProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleViewDetail = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setDetailOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha Apertura</TableHead>
            <TableHead>Fecha de Cierre</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Diferencia de Apertura</TableHead>
            <TableHead>Ventas Totales</TableHead>
            <TableHead>Diferencia de Cierre</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando sesiones...
                </div>
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {search
                  ? "No se encontraron sesiones"
                  : "No hay sesiones registradas"}
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.id}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(session.openedAt)}</div>
                    <div className="text-muted-foreground">
                      {formatTime(session.openedAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {session.closedAt ? (
                    <div className="text-sm">
                      <div>{formatDate(session.closedAt)}</div>
                      <div className="text-muted-foreground">
                        {formatTime(session.closedAt)}
                      </div>
                    </div>
                  ) : (
                    <Badge className="bg-green-500 hover:bg-green-500">Abierto</Badge>
                  )}
                </TableCell>
                <TableCell>{session.branchName}</TableCell>
                <TableCell>
                  {session.openingDifference !== null ? (
                    <span
                      className={
                        session.openingDifference < 0
                          ? "text-destructive"
                          : session.openingDifference > 0
                          ? "text-green-500"
                          : ""
                      }
                    >
                      S/ {formatCurrency(session.openingDifference)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {session.totalSales !== null
                    ? `S/ ${formatCurrency(session.totalSales)}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {session.difference !== null ? (
                    <span
                      className={
                        session.difference < 0
                          ? "text-destructive"
                          : session.difference > 0
                          ? "text-green-500"
                          : ""
                      }
                    >
                      S/ {formatCurrency(session.difference)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetail(session.id)}
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <POSSessionDetailDialog
        sessionId={selectedSessionId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};

export default POSListTable;
