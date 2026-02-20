import { usePOSSessions } from "../hooks/usePOSSessions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/modules/sales/adapters/POS.adapter";

const getStatusVariant = (
  statusCode: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (statusCode) {
    case "OPE":
      return "default";
    case "CLO":
      return "secondary";
    default:
      return "outline";
  }
};

const POSSessions = () => {
  const navigate = useNavigate();
  const {
    sessions,
    loading,
    search,
    pagination,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    goToOpenPOS,
  } = usePOSSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sesiones de Caja</h1>
          <p className="text-muted-foreground mt-1">
            Historial de sesiones del punto de venta
          </p>
        </div>
        <Button onClick={goToOpenPOS}>
          <Plus className="w-4 h-4 mr-2" />
          Abrir Caja
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                type="text"
                placeholder="Buscar por usuario, sucursal o ID..."
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Dif. Apertura</TableHead>
                <TableHead className="text-right">Dif. Cierre</TableHead>
                <TableHead className="text-right">Monto Cierre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sessions.length === 0 ? (
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
                  <TableCell
                    colSpan={8}
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
                    <TableCell>{session.branchName}</TableCell>
                    <TableCell>
                      {format(new Date(session.openedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {session.closedAt
                        ? format(new Date(session.closedAt), "dd/MM/yyyy HH:mm")
                        : session.statusCode === "OPE"
                        ? <Badge variant="default">Abierto</Badge>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          session.openingDifference < 0
                            ? "text-destructive"
                            : session.openingDifference > 0
                            ? "text-green-600"
                            : ""
                        }
                      >
                        S/ {formatCurrency(session.openingDifference)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {session.difference !== null ? (
                        <span
                          className={
                            session.difference < 0
                              ? "text-destructive"
                              : session.difference > 0
                              ? "text-green-600"
                              : ""
                          }
                        >
                          S/ {formatCurrency(session.difference)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.closingAmount !== null
                        ? `S/ ${formatCurrency(session.closingAmount)}`
                        : "—"}
                    </TableCell>
                    <TableCell>{session.userName}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Future: navigate to session detail
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default POSSessions;
