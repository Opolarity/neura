import { Edit, Shield, Trash, UserCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Role } from '../../types/Roles.types';
import { ComponentPermission } from '@/shared/components/component-permission';

// Rol, Tipo, Usuarios, Permisos, Acciones. Si el rol no puede editar ni
// eliminar, la columna de Acciones no se pinta y este número queda uno largo:
// solo afecta a las filas de "cargando" y "no se encontraron roles", y la
// columna sobrante colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 5;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["roles.edit", "roles.delete"];

interface RolesTableProps {
    roles: Role[];
    loading: boolean;
    onDeleteClick: (role: Role) => void;
    handleEditRole: (roleId: number) => void;
}

const RolesTable = ({ roles, loading, onDeleteClick, handleEditRole }: RolesTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Permisos</TableHead>
                    {/* Se envuelve el th entero y no su texto: una celda vacía
                        sigue ocupando su ancho y deja un hueco muerto. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead>Acciones</TableHead>
                    </ComponentPermission>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading && roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando roles...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground">
                                No se encontraron roles
                            </TableCell>
                        </TableRow>
                    ) : (
                        roles.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{r.name}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={r.isAdmin ? 'destructive' : 'secondary'} className="gap-1">
                                        {r.isAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                        {r.isAdmin ? 'Administrador' : 'Regular'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {r.userCount || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {r.permissionCount || 0} {r.permissionCount === 1 ? 'permiso' : 'permisos'}
                                    </Badge>
                                </TableCell>
                                <ComponentPermission codeIn={ACTION_CODES}>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {/* Editar lleva a /settings/roles/edit/:id, ya
                                                protegida con roles.edit: se reutiliza ese
                                                code. */}
                                            <ComponentPermission codeIn={["roles.edit"]}>
                                                <Button variant="outline" size="sm" title="Editar el rol" onClick={() => handleEditRole(r.id)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </ComponentPermission>
                                            <ComponentPermission codeIn={["roles.delete"]}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    title="Eliminar el rol"
                                                    onClick={() => onDeleteClick(r)}
                                                >
                                                    <Trash className="w-4 h-4" />
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

export default RolesTable;
