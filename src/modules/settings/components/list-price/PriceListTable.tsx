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
import { Edit, Loader2, Trash2 } from "lucide-react";
import { PriceList } from "../../types/PriceList.types";

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
          <TableHead>Código</TableHead>
          <TableHead className="text-center">Ubicación</TableHead>
          <TableHead className="text-center">Web</TableHead>
          <TableHead className="text-center w-28">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando listas de precios...
              </div>
            </TableCell>
          </TableRow>
        ) : prices.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
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
              <TableCell>
                {item.code ? (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {item.code}
                  </code>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">{item.location}</TableCell>
              <TableCell className="text-center">
                <Badge variant={item.isWeb ? "default" : "secondary"}>
                  {item.isWeb ? "Sí" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
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
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteClick(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default PriceListTable;
