import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerPointsMovement } from "../hooks/useCustomerPointsMovements";

interface CustomerPointsMovementsTableProps {
  data: CustomerPointsMovement[];
  loading: boolean;
}

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const CustomerPointsMovementsTable = ({
  data,
  loading,
}: CustomerPointsMovementsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° Documento</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-center">Movimiento</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando movimientos...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
              No se encontraron movimientos
            </TableCell>
          </TableRow>
        ) : (
          data.map((mov) => {
            const isPositive = mov.quantity >= 0;
            return (
              <TableRow key={mov.id}>
                <TableCell className="font-mono">{mov.documentNumber}</TableCell>
                <TableCell className="font-medium">{mov.fullName}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      isPositive
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    }
                  >
                    {isPositive ? "+" : ""}
                    {mov.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDate(mov.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {mov.note ?? "—"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
