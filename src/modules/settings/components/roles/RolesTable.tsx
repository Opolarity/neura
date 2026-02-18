import { Edit, Shield, Trash2, UserCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Role } from '../../types/Roles.types';

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
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Funciones Asignadas</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading && roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando roles...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No se encontraron roles
                            </TableCell>
                        </TableRow>
                    ) : (
                        roles.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-mono text-sm">{r.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-primary" />
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
                                    <Badge variant="outline">{r.functionCount || 0} funciones</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => handleEditRole(r.id)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDeleteClick(r)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )
                }
            </TableBody>
        </Table>
    );
};

export default RolesTable;