import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Loader2, Trash } from "lucide-react";
import type { Tag, EditTagPayload } from "@/modules/products/types/Tags.types";

interface TagsTableProps {
  tags: Tag[];
  isLoading: boolean;
  error: boolean;
  onEdit: (payload: EditTagPayload) => void;
  onDelete: (tag: Tag) => void;
}

export default function TagsTable({ tags, isLoading, error, onEdit, onDelete }: TagsTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando etiquetas...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-destructive">
            No se pudieron cargar los datos.
          </TableCell>
        </TableRow>
      );
    }

    if (tags.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
            No hay etiquetas registradas.
          </TableCell>
        </TableRow>
      );
    }

    return tags.map((tag) => (
      <TableRow key={tag.id}>
        <TableCell className="font-mono text-muted-foreground">{tag.id}</TableCell>
        <TableCell>{tag.name}</TableCell>
        <TableCell>{tag.code}</TableCell>
        <TableCell>{tag.products_count}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit({ id: tag.id, name: tag.name, code: tag.code })}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(tag)}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  );
}
