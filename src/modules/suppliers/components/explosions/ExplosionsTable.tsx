import { Loader2, SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateDisplay } from "@/shared/utils/date";
import { Explosion } from "../../types/explosions.types";

interface ExplosionsTableProps {
  explosions: Explosion[];
  loading: boolean;
  onEdit: (explosion: Explosion) => void;
}

const formatDate = (value: string) => (value ? formatDateDisplay(value) : "—");

export const ExplosionsTable = ({
  explosions,
  loading,
  onEdit,
}: ExplosionsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="w-32">Modelo</TableHead>
          <TableHead>Categorías</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && explosions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando desarrollos...
              </div>
            </TableCell>
          </TableRow>
        ) : explosions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground p-10">
              No se encontraron desarrollos
            </TableCell>
          </TableRow>
        ) : (
          explosions.map((explosion) => (
            <TableRow key={explosion.id}>
              <TableCell className="font-medium">{explosion.id}</TableCell>
              <TableCell>{explosion.description || "—"}</TableCell>
              <TableCell className="tabular-nums">{explosion.modelCode ?? "—"}</TableCell>

              <TableCell>
                {explosion.categories.length === 0 ? (
                  <span className="text-muted-foreground text-sm">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {explosion.categories.map((category) => (
                      <Badge key={category.id} variant="outline">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>

              <TableCell className="text-right">{explosion.total.toFixed(2)}</TableCell>
              <TableCell>{formatDate(explosion.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(explosion)}
                  aria-label={`Editar desarrollo ${explosion.id}`}
                >
                  <SquarePen className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
