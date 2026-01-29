import { Edit, Link, Shield, Trash2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouses } from '../../types/Warehouses.types';

interface WarehousesTableProps {
    warehouses: Warehouses[];
    loading: boolean;
    handleDeleteWarehouse: (warehouseId: number) => void;
}

const WarehousesTable = ({ warehouses, loading, handleDeleteWarehouse }: WarehousesTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Locales</TableHead>
                    <TableHead>Pais</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Distrito</TableHead>
                    <TableHead>Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                Cargando almacenes...
                            </TableCell>
                        </TableRow>
                    ) : warehouses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                No se encontraron almacenes
                            </TableCell>
                        </TableRow>
                    ) : (
                        warehouses.map((w) => (
                            <TableRow key={w.id}>
                                <TableCell className="font-mono text-sm">{w.id}</TableCell>
                                <TableCell>{w.name}</TableCell>
                                <TableCell>
                                    {w.branches}
                                </TableCell>
                                <TableCell>
                                    {w.countries}
                                </TableCell>
                                <TableCell>
                                    {w.states}
                                </TableCell>
                                <TableCell>
                                    {w.cities}
                                </TableCell>
                                <TableCell>
                                    {w.neighborhoods}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link to={`/settings/warehouses/edit/${w.id}`}>
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteWarehouse(w.id)}
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

export default WarehousesTable;