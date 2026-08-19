import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { BranchView } from '../../types/Branches.types';
import { ComponentPermission } from '@/shared/components/component-permission';

// ID, Nombre, Almacén, País, Ciudad, Provincia, Distrito, Acciones. Si el rol
// no puede editar ni eliminar, la columna de Acciones no se pinta y este número
// queda uno largo: solo afecta a las filas de "cargando" y "no se encontraron
// sucursales", y la columna sobrante colapsa a 0px porque ninguna otra fila la
// ocupa.
const COL_SPAN = 8;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["branches.edit", "branches.delete"];

interface BranchesTableProps {
    branches: BranchView[];
    loading: boolean;
    onDeleteClick: (branch: BranchView) => void;
}

const BranchesTable = ({ branches, loading, onDeleteClick }: BranchesTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Distrito</TableHead>
                    {/* Se envuelve el th entero y no su texto: una celda vacía
                        sigue ocupando su ancho y deja un hueco muerto. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead>Acciones</TableHead>
                    </ComponentPermission>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading && branches.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando sucursales...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : branches.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground">
                                No se encontraron sucursales
                            </TableCell>
                        </TableRow>
                    ) : (
                        branches.map((branch, index) => (
                            <TableRow key={branch.id ? `${branch.id}-${index}` : index}>
                                <TableCell className="font-mono text-sm">{branch.id}</TableCell>
                                <TableCell>{branch.name}</TableCell>
                                <TableCell>{branch.warehouse}</TableCell>
                                <TableCell>{branch.countries}</TableCell>
                                <TableCell>{branch.states}</TableCell>
                                <TableCell>{branch.cities}</TableCell>
                                <TableCell>{branch.neighborhoods}</TableCell>
                                <ComponentPermission codeIn={ACTION_CODES}>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {/* El botón lleva a /settings/branches/edit/:id, ya
                                                protegida con branches.edit: se reutiliza ese
                                                code. */}
                                            <ComponentPermission codeIn={["branches.edit"]}>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/settings/branches/edit/${branch.id}`}>
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </ComponentPermission>
                                            <ComponentPermission codeIn={["branches.delete"]}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => onDeleteClick(branch)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </ComponentPermission>
                                        </div>
                                    </TableCell>
                                </ComponentPermission>
                            </TableRow>
                        ))
                    )
                }
            </TableBody>
        </Table>
    );
};

export default BranchesTable;
