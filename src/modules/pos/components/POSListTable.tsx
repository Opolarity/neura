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

  const getStatusBadge = (statusCode: string, statusName: string) => {
    if (statusCode === "OPE") {
      return <Badge className="bg-green-500 hover:bg-green-500">{statusName}</Badge>;
    }
    if (statusCode === "CLO") {
      return <Badge className="bg-gray-500 hover:bg-gray-500">{statusName}</Badge>;
    }
    return <Badge variant="outline">{statusName}</Badge>;
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
            <TableHead>Usuario</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Monto Apertura</TableHead>
            <TableHead>Ventas</TableHead>
            <TableHead>Monto Cierre</TableHead>
            <TableHead>Diferencia</TableHead>
            <TableHead>Apertura</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando sesiones...
                </div>
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                {search
                  ? "No se encontraron sesiones"
                  : "No hay sesiones registradas"}
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.id}</TableCell>
                <TableCell>{session.userName}</TableCell>
                <TableCell>{session.branchName}</TableCell>
                <TableCell>S/ {formatCurrency(session.openingAmount)}</TableCell>
                <TableCell>
                  {session.totalSales !== null
                    ? `S/ ${formatCurrency(session.totalSales)}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {session.closingAmount !== null
                    ? `S/ ${formatCurrency(session.closingAmount)}`
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
