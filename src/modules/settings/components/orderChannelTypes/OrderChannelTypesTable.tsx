import { useNavigate } from "react-router-dom";
import { Edit, Loader2, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrderChannelType } from "../../types/OrderChannelTypes.types";

interface OrderChannelTypesTableProps {
  orderChannelTypes: OrderChannelType[];
  loading: boolean;
  onDelete?: (id: number) => void;
}

const OrderChannelTypesTable = ({
  orderChannelTypes,
  loading,
  onDelete,
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
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando canales de venta...
              </div>
            </TableCell>
          </TableRow>
        ) : orderChannelTypes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(type.id)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar canal de venta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se desactivará el canal "{type.name}". Podrás reactivarlo editándolo posteriormente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete?.(type.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OrderChannelTypesTable;
