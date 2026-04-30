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
import { MovementClass } from "../../types/MovementClasses.types";

interface MovementClassesTableProps {
  loading: boolean;
  classes: MovementClass[];
  onEditItem: (item: MovementClass) => void;
  onOpenChange: (open: boolean) => void;
}

const MovementClassesTable = ({
  loading,
  classes,
  onEditItem,
  onOpenChange,
}: MovementClassesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead className="text-center w-28">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando clases...
              </div>
            </TableCell>
          </TableRow>
        ) : classes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
              No se encontraron clases de movimiento
            </TableCell>
          </TableRow>
        ) : (
          classes.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{item.code}</TableCell>
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

export default MovementClassesTable;
