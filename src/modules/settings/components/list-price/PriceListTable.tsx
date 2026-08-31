import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Trash } from "lucide-react";
import { PriceList } from "../../types/PriceList.types";
import { ComponentPermission } from "@/shared/components/component-permission";

// ID, Nombre, Acciones. Si el rol no puede editar ni eliminar, la columna de
// Acciones no se pinta y este número queda uno largo: solo afecta a las filas de
// "cargando" y "no se encontraron listas de precios", y la columna sobrante
// colapsa a 0px porque ninguna otra fila la ocupa.
//
// Antes ponía 6, el doble de las columnas reales.
const COL_SPAN = 3;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["price_lists.edit", "price_lists.delete"];

interface PriceListTableProps {
  loading: boolean;
  prices: PriceList[];
  onEditItem: (item: PriceList) => void;
  onOpenChange: (open: boolean) => void;
  onDeleteClick: (item: PriceList) => void;
}

const PriceListTable = ({
  loading,
  prices,
  onEditItem,
  onDeleteClick,
  onOpenChange,
}: PriceListTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          {/* Se envuelve el th entero y no su texto: una celda vacía sigue
              ocupando su ancho y deja un hueco muerto. */}
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
                Cargando listas de precios...
              </div>
            </TableCell>
          </TableRow>
        ) : prices.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COL_SPAN}
              className="text-center py-10 text-muted-foreground"
            >
              No se encontraron listas de precios
            </TableCell>
          </TableRow>
        ) : (
          prices.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-muted-foreground">
                {item.id}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ComponentPermission codeIn={["price_lists.edit"]}>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Editar la lista de precios"
                        onClick={() => {
                          onEditItem(item);
                          onOpenChange(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </ComponentPermission>
                    <ComponentPermission codeIn={["price_lists.delete"]}>
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Eliminar la lista de precios"
                        onClick={() => onDeleteClick(item)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
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

export default PriceListTable;
