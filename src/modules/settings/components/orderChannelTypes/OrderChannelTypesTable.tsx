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
          <TableHead>POS</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando canales de venta...
              </div>
            </TableCell>
          </TableRow>
        ) : orderChannelTypes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No hay canales de venta registrados.
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
                {type.pos_sale_type ? (
                  <Badge variant="default">Sí</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell>
                {type.is_active ? (
                  <Badge variant="default">Activo</Badge>
                ) : (
                  <Badge variant="destructive">Inactivo</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEdit(type.id)}>
                  <Edit className="w-4 h-4 mr-1" /> Editar
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
