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
   * Solo Operaciones: pinta «Operación padre» y sangra las hijas bajo su padre
   * (el SP ya las devuelve en ese orden). La pantalla de Procesos no la pasa.
   */
  showOperationFields?: boolean;
  /**
   * Solo Procesos: badge «Por defecto» junto al nombre, y sin editar ni
   * borrar los por defecto (Corte, Costura, Acabado).
   */
  showEssentialBadge?: boolean;
  /** Procesos (2026-10-20): sin columna Código, el código lo pone el backend. */
  showCode?: boolean;
  onEdit: (item: ProcessCatalogItem) => void;
  onDelete: (item: ProcessCatalogItem) => void;
}

const formatDate = (value: string) => (value ? formatDateDisplay(value) : "—");

export const ProcessCatalogTable = ({
  items,
  loading,
  entityLabel,
  showOperationFields = false,
  showEssentialBadge = false,
  showCode = true,
  onEdit,
  onDelete,
}: ProcessCatalogTableProps) => {
  // Una columna más en Operaciones: ajusta el colSpan de las filas de carga
  // y vacío.
  const colSpan = 5 + (showOperationFields ? 1 : 0) + (showCode ? 1 : 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          {showCode && <TableHead>Código</TableHead>}
          {showOperationFields && <TableHead>Bloque</TableHead>}
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
              <TableCell>
                {/* Las hijas, sangradas bajo su padre. */}
                {showOperationFields && item.parentProcessId !== null ? (
                  <span className="pl-4 text-muted-foreground">↳ </span>
                ) : null}
                {item.name}
                {showEssentialBadge && item.isDefault && (
                  <Badge variant="info" className="ml-2">
                    Por defecto
                  </Badge>
                )}
                {showOperationFields && item.childrenCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {item.childrenCount} {item.childrenCount === 1 ? "operación" : "operaciones"}
                  </Badge>
                )}
              </TableCell>
              {showCode && (
                <TableCell>
                  {item.code ?? <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
              )}
              {/* La operación padre que la agrupa. */}
              {showOperationFields && (
                <TableCell>
                  {item.parentProcessName ? (
                    <Badge variant="secondary">{item.parentProcessName}</Badge>
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
                {/* Los por defecto son fijos: ni se editan ni se borran. */}
                {!(showEssentialBadge && item.isDefault) && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title={`Editar ${entityLabel}`}
                      aria-label={`Editar ${entityLabel} ${item.name}`}
                    >
                      <SquarePen className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!item.isActive}
                      onClick={() => onDelete(item)}
                      title={`Desactivar ${entityLabel}`}
                      aria-label={`Desactivar ${entityLabel} ${item.name}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
