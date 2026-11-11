import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, SquarePen, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/shared/utils/date";
import { ProcessCatalogItem } from "../../types/processes.types";

interface OperationBlocksTableProps {
  items: ProcessCatalogItem[];
  loading: boolean;
  /** Con búsqueda se despliegan todos: que se vea lo encontrado. */
  expandAll: boolean;
  onEdit: (item: ProcessCatalogItem) => void;
  onDelete: (item: ProcessCatalogItem) => void;
}

/** Un bloque y sus operaciones. `block` es null si el bloque no vino en la página. */
interface Grupo {
  key: string;
  block: ProcessCatalogItem | null;
  name: string;
  operations: ProcessCatalogItem[];
}

const COLUMNAS = 6;
const fecha = (value: string) => (value ? formatDateDisplay(value) : "—");

/**
 * Las operaciones agrupadas por BLOQUE (2026-10-19), como Atributos de
 * producto: una fila por bloque, plegada al cargar, y al desplegarla sus
 * operaciones sangradas. Un bloque sin operaciones va completo en la ruta.
 */
export const OperationBlocksTable = ({ items, loading, expandAll, onEdit, onDelete }: OperationBlocksTableProps) => {
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  // La página trae los bloques y sus operaciones en orden; una operación cuyo
  // bloque quedó en otra página (o no coincide con la búsqueda) arma su grupo
  // con el nombre del padre.
  const grupos: Grupo[] = [];
  const porClave = new Map<string, Grupo>();
  for (const item of items) {
    const esBloque = item.parentProcessId === null;
    const key = esBloque ? `b${item.id}` : `b${item.parentProcessId}`;
    let grupo = porClave.get(key);
    if (!grupo) {
      grupo = { key, block: null, name: esBloque ? item.name : (item.parentProcessName ?? "Sin bloque"), operations: [] };
      porClave.set(key, grupo);
      grupos.push(grupo);
    }
    if (esBloque) {
      grupo.block = item;
      grupo.name = item.name;
    } else {
      grupo.operations.push(item);
    }
  }

  const toggle = (key: string) =>
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const acciones = (item: ProcessCatalogItem, etiqueta: string) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(item)}
        title={`Editar ${etiqueta}`}
        aria-label={`Editar ${etiqueta} ${item.name}`}
      >
        <SquarePen className="w-4 h-4" />
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={!item.isActive}
        onClick={() => onDelete(item)}
        title={`Desactivar ${etiqueta}`}
        aria-label={`Desactivar ${etiqueta} ${item.name}`}
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  );

  const estado = (item: ProcessCatalogItem) => (
    <Badge variant={item.isActive ? "success" : "destructive"}>{item.isActive ? "Activo" : "Inactivo"}</Badge>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Operaciones</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-[100px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNAS} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando operaciones...
              </div>
            </TableCell>
          </TableRow>
        ) : grupos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNAS} className="text-center text-muted-foreground p-10">
              No se encontraron operaciones
            </TableCell>
          </TableRow>
        ) : (
          grupos.map((grupo) => {
            const abierto = expandAll || abiertos.has(grupo.key);
            const cantidad = grupo.block?.childrenCount ?? grupo.operations.length;
            return (
              <Fragment key={grupo.key}>
                {/* Fila del bloque */}
                <TableRow
                  className="bg-muted/50 cursor-pointer hover:bg-muted/70 [&>td]:py-3"
                  onClick={() => toggle(grupo.key)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {abierto ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-semibold">{grupo.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {grupo.block?.code ?? <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {cantidad === 0 ? "Completo" : `${cantidad} ${cantidad === 1 ? "operación" : "operaciones"}`}
                  </TableCell>
                  <TableCell>{grupo.block ? estado(grupo.block) : null}</TableCell>
                  <TableCell className="text-sm">{grupo.block ? fecha(grupo.block.createdAt) : ""}</TableCell>
                  <TableCell>{grupo.block ? acciones(grupo.block, "bloque") : null}</TableCell>
                </TableRow>

                {/* Sus operaciones, al desplegar */}
                {abierto &&
                  grupo.operations.map((op) => (
                    <TableRow key={op.id} className="[&>td]:py-2">
                      <TableCell>
                        <div className="flex items-center gap-2 pl-8">
                          <span className="text-muted-foreground">•</span>
                          <span>{op.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{op.code ?? <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                      <TableCell className="text-muted-foreground italic text-sm">—</TableCell>
                      <TableCell>{estado(op)}</TableCell>
                      <TableCell className="text-sm">{fecha(op.createdAt)}</TableCell>
                      <TableCell>{acciones(op, "operación")}</TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
