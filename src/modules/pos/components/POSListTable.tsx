import { useState } from "react";
import { formatDateTime } from "@/shared/utils/date";
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
import {
  formatCurrency,
  formatTime,
} from "@/modules/sales/adapters/POS.adapter";

import POSSessionDetailDialog from "./POSSessionDetailDialog";
import { ComponentPermission } from "@/shared/components/component-permission";

interface POSListTableProps {
  sessions: POSSessionListItem[];
  loading: boolean;
  search: string;
}

// ID, Usuario, Fecha de Apertura, Monto de Apertura, Monto de Cierre, Fecha
// de Cierre, Sucursal, Acciones. Si el rol no puede ver el detalle, la columna
// de Acciones no se pinta y este número queda uno largo: solo afecta a las
// filas de "cargando" y "no hay sesiones", y la columna sobrante colapsa a 0px
// porque ninguna otra fila la ocupa.
//
// Antes ponía 7, uno MENOS que las columnas reales, así que la fila de vacío
// se quedaba sin cubrir la última columna.
const COL_SPAN = 8;

// Code de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["pos.view"];

const POSListTable = ({ sessions, loading, search }: POSListTableProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const formatDate = (dateString: string) => formatDateTime(dateString);

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
            <TableHead>Fecha de Apertura</TableHead>
            <TableHead>Monto de Apertura</TableHead>
            <TableHead>Monto de Cierre</TableHead>
            <TableHead>Fecha de Cierre</TableHead>
            <TableHead>Sucursal</TableHead>
            {/* Se envuelve el th entero y no su texto: una celda vacía sigue
                ocupando su ancho y deja un hueco muerto. */}
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableHead>Acciones</TableHead>
            </ComponentPermission>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando sesiones...
                </div>
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COL_SPAN}
                className="text-center py-8 text-muted-foreground"
              >
                {search
                  ? "No se encontraron sesiones"
                  : "No hay sesiones registradas"}
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.id}</TableCell>
                <TableCell className="font-medium">
                  {session.userName}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(session.openedAt)}</div>
                    <div className="text-muted-foreground">
                      {formatTime(session.openedAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  className={
                    session.openingDifference !== null &&
                    session.openingDifference !== 0
                      ? "text-destructive"
                      : ""
                  }
                >
                  S/ {formatCurrency(session.openingAmount)}
                </TableCell>
                <TableCell
                  className={
                    session.difference !== null && session.difference !== 0
                      ? "text-destructive"
                      : ""
                  }
                >
                  {session.closingAmount !== null
                    ? `S/ ${formatCurrency(session.closingAmount)}`
                    : "-"}
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
                    <Badge variant="success">
                      Abierto
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{session.branchName}</TableCell>
                <ComponentPermission codeIn={ACTION_CODES}>
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
                </ComponentPermission>
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
