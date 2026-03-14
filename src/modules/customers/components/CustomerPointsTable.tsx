import { Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerPoint } from "../hooks/useCustomerPoints";

interface CustomerPointsTableProps {
  data: CustomerPoint[];
  loading: boolean;
}

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const CustomerPointsTable = ({ data, loading }: CustomerPointsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo Doc.</TableHead>
          <TableHead>N° Documento</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Cliente desde</TableHead>
          <TableHead className="text-center">Puntaje</TableHead>
          <TableHead className="text-center">Compras</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando puntos...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
              No se encontraron clientes
            </TableCell>
          </TableRow>
        ) : (
          data.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.documentType}</TableCell>
              <TableCell className="font-mono">{customer.documentNumber}</TableCell>
              <TableCell className="font-medium">{customer.fullName}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(customer.customerSince)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/20 gap-1">
                  <Star className="w-3 h-3" />
                  {customer.points ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{customer.ordersQuantity}</Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
