import { useState } from "react";
import { Edit, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderChannelType } from "../../types/OrderChannelTypes.types";

interface OrderChannelTypesTableProps {
  orderChannelTypes: OrderChannelType[];
  loading: boolean;
}

const OrderChannelTypesTable = ({
  orderChannelTypes,
  loading,
}: OrderChannelTypesTableProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setEditingId(id);
    console.log("Editar tipo de canal:", id);
  };
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              Cargando tipos de canales...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderChannelTypes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              No hay tipos de canales de pedido registrados.
            </TableCell>
          </TableRow>
        ) : (
          orderChannelTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-mono text-sm">{type.id}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{type.code}</Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => handleEdit(type.id)}>
                  <Edit className="w-4 h-4">Editar</Edit>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OrderChannelTypesTable;
