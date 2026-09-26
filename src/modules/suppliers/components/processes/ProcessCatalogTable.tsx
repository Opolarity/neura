import { Loader2, SquarePen, Trash } from "lucide-react";
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
import { ProcessCatalogItem } from "../../types/processes.types";

interface ProcessCatalogTableProps {
  items: ProcessCatalogItem[];
  loading: boolean;
  /** "proceso" / "operación", para los aria-labels de las acciones. */
  entityLabel: string;
  /**
   * Solo Operaciones: pinta la columna "Proceso" (la etapa a la que pertenece
   * la operación). La pantalla de Procesos no la pasa.
   */
  showGroup?: boolean;
  onEdit: (item: ProcessCatalogItem) => void;
  onDelete: (item: ProcessCatalogItem) => void;
}

const formatDate = (value: string) => (value ? formatDateDisplay(value) : "—");

export const ProcessCatalogTable = ({
  items,
  loading,
  entityLabel,
  showGroup = false,
  onEdit,
  onDelete,
}: ProcessCatalogTableProps) => {
  // Una columna más cuando se muestra el grupo: ajusta el colSpan de las filas
  // de carga y vacío.
  const colSpan = showGroup ? 7 : 6;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          {showGroup && <TableHead>Proceso</TableHead>}
          <TableHead>Estado</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </div>
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-muted-foreground p-10">
              No se encontraron registros
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                {item.code ?? <span className="text-muted-foreground text-sm">—</span>}
              </TableCell>
              {/* El proceso (etapa) al que pertenece la operación. */}
              {showGroup && (
                <TableCell>
                  {item.processGroupName ? (
                    <Badge variant="secondary">{item.processGroupName}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge variant={item.isActive ? "success" : "destructive"}>
                  {item.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(item.createdAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                    aria-label={`Editar ${entityLabel} ${item.name}`}
                  >
                    <SquarePen className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!item.isActive}
                    onClick={() => onDelete(item)}
                    aria-label={`Desactivar ${entityLabel} ${item.name}`}
                  >
                    <Trash className="w-4 h-4" />
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
