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
          <TableHead className="text-center w-28">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando tipos de stock...
              </div>
            </TableCell>
          </TableRow>
        ) : stockTypes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
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
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default StockTypeTable;
