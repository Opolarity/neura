import { Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  SquarePen,
  Trash,
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
import {
  MaterialTermGroup,
  MaterialTerm,
} from "../../types/materialTerms.types";

interface MaterialTermsTableProps {
  groups: MaterialTermGroup[];
  expanded: Set<number>;
  onToggle: (id: number) => void;
  loading: boolean;
  onEditGroup: (group: MaterialTermGroup) => void;
  onDeleteGroup: (group: MaterialTermGroup) => void;
  onCreateTerm: (groupId: number) => void;
  onEditTerm: (value: MaterialTerm, groupId: number) => void;
  onDeleteTerm: (value: MaterialTerm) => void;
}

const variaciones = (n: number) =>
  n === 0 ? "Sin uso" : `${n} ${n === 1 ? "variación" : "variaciones"}`;

/**
 * Una fila por atributo y sus términos al desplegar: el reparto de los
 * atributos de producto y de las clases de materiales.
 */
export const MaterialTermsTable = ({
  groups,
  expanded,
  onToggle,
  loading,
  onEditGroup,
  onDeleteGroup,
  onCreateTerm,
  onEditTerm,
  onDeleteTerm,
}: MaterialTermsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Atributo</TableHead>
        <TableHead className="w-40">Código</TableHead>
        <TableHead className="w-40">Términos</TableHead>
        <TableHead className="w-40">Uso</TableHead>
        <TableHead className="w-[140px]">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={5} className="py-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando atributos...
            </div>
          </TableCell>
        </TableRow>
      ) : groups.length === 0 ? (
        <TableRow>
          <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
            Todavía no hay atributos de materiales
          </TableCell>
        </TableRow>
      ) : (
        groups.map((group) => {
          const abierto = expanded.has(group.id);

          return (
            <Fragment key={group.id}>
              <TableRow
                className="bg-muted/50 hover:bg-muted/70 cursor-pointer [&>td]:py-3"
                onClick={() => onToggle(group.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {abierto ? (
                      <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    <span className="font-semibold">{group.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{group.code}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {group.terms.length === 0
                    ? "Sin términos"
                    : `${group.terms.length} ${group.terms.length === 1 ? "término" : "términos"}`}
                </TableCell>
                <TableCell className="text-sm">{variaciones(group.variationsCount)}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateTerm(group.id)}
                      title={`Nuevo término de ${group.name}`}
                      aria-label={`Nuevo término de ${group.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditGroup(group)}
                      title={`Editar ${group.name}`}
                      aria-label={`Editar ${group.name}`}
                    >
                      <SquarePen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteGroup(group)}
                      title={`Desactivar ${group.name}`}
                      aria-label={`Desactivar ${group.name}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {abierto &&
                group.terms.map((value) => (
                  <TableRow key={`término-${value.id}`} className="[&>td]:py-2">
                    <TableCell>
                      <div className="flex items-center gap-2 pl-8">
                        <span className="text-muted-foreground">•</span>
                        <span>{value.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm italic">—</TableCell>
                    <TableCell className="text-muted-foreground text-sm italic">—</TableCell>
                    <TableCell className="text-sm">{variaciones(value.variationsCount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditTerm(value, group.id)}
                          title={`Editar ${value.name}`}
                          aria-label={`Editar ${value.name}`}
                        >
                          <SquarePen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteTerm(value)}
                          title={`Desactivar ${value.name}`}
                          aria-label={`Desactivar ${value.name}`}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
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

export default MaterialTermsTable;
