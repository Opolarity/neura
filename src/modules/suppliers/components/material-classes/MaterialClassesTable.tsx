import { Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  SquarePen,
} from "lucide-react";
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
import { MaterialClassNode } from "../../utils/materialClassTree";

interface MaterialClassesTableProps {
  /** Las familias de la página. Lo de dentro sale al desplegar. */
  roots: MaterialClassNode[];
  /** Lo que cuelga de una familia, a cualquier profundidad. */
  descendantsOf: (id: number) => MaterialClassNode[];
  expanded: Set<number>;
  onToggle: (id: number) => void;
  loading: boolean;
  onEdit: (materialClass: MaterialClassNode) => void;
}

/** El código marca las raíces canónicas del módulo; se lee, no se edita. */
const Codigo = ({ code }: { code?: string | null }) =>
  code ? (
    <Badge variant="outline">{code}</Badge>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

/**
 * El catálogo, con el mismo reparto que los atributos de producto: **una fila
 * por familia**, y lo de dentro al desplegar.
 *
 * No es solo estética. Es lo que permite paginar sin romper el árbol: la página
 * corta familias, no clases, así que un color de jersey no puede acabar en la
 * página siguiente que su jersey.
 */
export const MaterialClassesTable = ({
  roots,
  descendantsOf,
  expanded,
  onToggle,
  loading,
  onEdit,
}: MaterialClassesTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Clase</TableHead>
        <TableHead className="w-40">Código</TableHead>
        <TableHead className="w-40">Contenido</TableHead>
        <TableHead className="w-[100px]">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={4} className="py-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando clases...
            </div>
          </TableCell>
        </TableRow>
      ) : roots.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={4}
            className="text-muted-foreground py-8 text-center"
          >
            Todavía no hay clases de materiales
          </TableCell>
        </TableRow>
      ) : (
        roots.map((familia) => {
          const abierta = expanded.has(familia.id);
          const dentro = descendantsOf(familia.id);

          // Fragment CON key: la familia y sus clases son varias filas de una
          // sola vuelta del map, y un `<>` pelado deja a React sin identidad
          // para el grupo.
          return (
            <Fragment key={familia.id}>
              <TableRow
                className="bg-muted/50 hover:bg-muted/70 cursor-pointer [&>td]:py-3"
                onClick={() => onToggle(familia.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {abierta ? (
                      <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    <span className="font-semibold">{familia.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Codigo code={familia.code} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {dentro.length === 0
                    ? "Sin clases dentro"
                    : `${dentro.length} ${dentro.length === 1 ? "clase" : "clases"}`}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(familia)}
                    title={`Editar ${familia.name}`}
                    aria-label={`Editar ${familia.name}`}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>

              {abierta &&
                dentro.map((clase) => (
                  <TableRow key={`clase-${clase.id}`} className="[&>td]:py-2">
                    <TableCell>
                      {/* La sangría dice de qué cuelga: TELA › Jersey › color
                          son tres niveles y hay que poder distinguirlos. El
                          nivel 1 arranca donde el chevron de su familia. */}
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${clase.level * 20 + 12}px` }}
                      >
                        <span className="text-muted-foreground">•</span>
                        <span>{clase.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Codigo code={clase.code} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm italic">
                      —
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(clase)}
                        title={`Editar ${clase.name}`}
                        aria-label={`Editar ${clase.name}`}
                      >
                        <SquarePen className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </Fragment>
          );
        })
      )}
    </TableBody>
  </Table>
);

export default MaterialClassesTable;
