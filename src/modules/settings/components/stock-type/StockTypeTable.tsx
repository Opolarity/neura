import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { StockType } from "../../types/StockType.types";
import { ComponentPermission } from "@/shared/components/component-permission";

// ID, Nombre, Acciones. Si el rol no puede editar, la columna de Acciones no se
// pinta y este número queda uno largo: solo afecta a las filas de "cargando" y
// "no se encontraron tipos de stock", y la columna sobrante colapsa a 0px
// porque ninguna otra fila la ocupa.
const COL_SPAN = 3;

// Code de la columna Acciones, en una constante para que la cabecera y la celda
// no puedan quedar con listas distintas y aparezca un th sin td o al revés.
const ACTION_CODES = ["stock_types.edit"];

interface StockTypeTableProps {
  loading: boolean;
  stockTypes: StockType[];
  onEditItem: (item: StockType) => void;
  onOpenChange: (open: boolean) => void;
}

const StockTypeTable = ({
  loading,
  stockTypes,
  onEditItem,
  onOpenChange,
}: StockTypeTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          {/* Se envuelve el th entero y no su texto: una celda vacía sigue
              ocupando sus 28 de ancho y deja un hueco muerto. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead className="text-center w-28">Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={COL_SPAN} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando tipos de stock...
              </div>
            </TableCell>
          </TableRow>
        ) : stockTypes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COL_SPAN}
              className="text-center py-10 text-muted-foreground"
            >
              No se encontraron tipos de stock
            </TableCell>
          </TableRow>
        ) : (
          stockTypes.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-muted-foreground">
                {item.id}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      onEditItem(item);
                      onOpenChange(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </ComponentPermission>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default StockTypeTable;
