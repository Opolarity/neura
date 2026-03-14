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

const getLevel = (points: number | null) => {
  const p = points ?? 0;
  if (p < 150)   return { label: "Sin nivel", className: "bg-gray-100 text-gray-500 hover:bg-gray-100" };
  if (p < 750)   return { label: "Nivel 1",   className: "bg-blue-100 text-blue-700 hover:bg-blue-100" };
  if (p < 1500)  return { label: "Nivel 2",   className: "bg-green-100 text-green-700 hover:bg-green-100" };
  if (p < 3000)  return { label: "Nivel 3",   className: "bg-orange-100 text-orange-700 hover:bg-orange-100" };
  return           { label: "Nivel 4",   className: "bg-purple-100 text-purple-700 hover:bg-purple-100" };
};

export const CustomerPointsTable = ({ data, loading }: CustomerPointsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo Doc.</TableHead>
          <TableHead>N° Documento</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Cliente desde</TableHead>
          <TableHead className="text-center">Nivel</TableHead>
          <TableHead className="text-center">Puntaje</TableHead>
          <TableHead className="text-center">Compras</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-10">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando puntos...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
              No se encontraron clientes
            </TableCell>
          </TableRow>
        ) : (
          data.map((customer) => {
            const level = getLevel(customer.points);
            return (
              <TableRow key={customer.id}>
                <TableCell>{customer.documentType}</TableCell>
                <TableCell className="font-mono">{customer.documentNumber}</TableCell>
                <TableCell className="font-medium">{customer.fullName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(customer.customerSince)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={level.className}>{level.label}</Badge>
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
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
