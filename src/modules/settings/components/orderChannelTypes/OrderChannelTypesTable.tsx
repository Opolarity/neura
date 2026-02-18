import { useNavigate } from "react-router-dom";
import { Edit, Loader2 } from "lucide-react";
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
  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/settings/order-channel-types/edit/${id}`);
  };

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
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando tipos de canales...
              </div>
            </TableCell>
          </TableRow>
        ) : orderChannelTypes.length === 0 ? (
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
                <Button variant="outline" size="sm" onClick={() => handleEdit(type.id)}>
                  <Edit >Editar</Edit>
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
