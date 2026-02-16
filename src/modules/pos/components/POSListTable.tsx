import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { POSSessionListItem } from "../types/POSList.types";
import { formatCurrency, formatTime } from "@/modules/sales/adapters/POS.adapter";

interface POSListTableProps {
  sessions: POSSessionListItem[];
  loading: boolean;
  search: string;
}

const POSListTable = ({ sessions, loading, search }: POSListTableProps) => {
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Sucursal</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead>Monto Apertura</TableHead>
          <TableHead>Ventas</TableHead>
          <TableHead>Monto Cierre</TableHead>
          <TableHead>Diferencia</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Apertura</TableHead>
          <TableHead>Cierre</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando sesiones...
              </div>
            </TableCell>
          </TableRow>
        ) : sessions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
              <TableCell>{session.warehouseName}</TableCell>
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
                        ? "text-red-500"
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
                {getStatusBadge(session.statusCode, session.statusName)}
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
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default POSListTable;
