import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { BranchView } from '../../types/Branches.types';

interface BranchesTableProps {
    branches: BranchView[];
    loading: boolean;
    handleDeleteBranch: (branchId: number) => void;
}

const BranchesTable = ({ branches, loading, handleDeleteBranch }: BranchesTableProps) => {
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
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading && branches.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando sucursales...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : branches.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link to={`/settings/branches/edit/${branch.id}`}>
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteBranch(branch.id)}
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

export default BranchesTable;
