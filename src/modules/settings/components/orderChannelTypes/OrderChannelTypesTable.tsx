import { useNavigate } from "react-router-dom";
import { Edit, Loader2, Trash } from "lucide-react";
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
import { ComponentPermission } from "@/shared/components/component-permission";
import { OrderChannelType } from "../../types/OrderChannelTypes.types";

interface OrderChannelTypesTableProps {
  orderChannelTypes: OrderChannelType[];
  loading: boolean;
  onDelete?: (id: number) => void;
}

// Codes de la columna Acciones. En una constante para que la cabecera y las
// celdas no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["sales_channels.edit", "sales_channels.delete"];

// ID, Nombre, Código, POS, Acciones. Si el rol no tiene ninguna acción, la
// columna no se pinta y este número queda uno largo: solo afecta a las filas de
// carga y de "no hay canales", y la columna sobrante colapsa a 0px porque
// ninguna otra fila la ocupa.
const COL_SPAN = 5;

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
          {/* Basta con tener UNA de las dos acciones para que la columna tenga
              sentido; cada botón de dentro lleva su propio code. Sin ninguna, se
              omite la celda entera para no dejar el hueco. */}
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
                Cargando canales de venta...
              </div>
            </TableCell>
          </TableRow>
        ) : orderChannelTypes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground">
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
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ComponentPermission codeIn={["sales_channels.edit"]}>
                      <Button variant="outline" size="sm" title="Editar el canal de venta" onClick={() => handleEdit(type.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </ComponentPermission>
                    {/* El AlertDialog entero va dentro: si solo se envolviera el
                        trigger, el diálogo de confirmación quedaría montado sin
                        forma de abrirlo. */}
                    <ComponentPermission codeIn={["sales_channels.delete"]}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" title="Eliminar el canal de venta">
                            <Trash className="w-4 h-4" />
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
                    </ComponentPermission>
                  </div>
                </TableCell>
              </ComponentPermission>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OrderChannelTypesTable;
