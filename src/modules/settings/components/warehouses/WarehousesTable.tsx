import { Edit, Trash2, } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WarehouseView } from '../../types/Warehouses.types';

interface WarehousesTableProps {
    warehouses: WarehouseView[];
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
                    <TableHead>Web</TableHead>
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
                        warehouses.map((w, index) => (
                            <TableRow key={w.id ? `${w.id}-${index}` : index}>
                                <TableCell className="font-mono text-sm">{w.id}</TableCell>
                                <TableCell>{w.name}</TableCell>
                                <TableCell>
                                    {w.branches?.map(b => b.name).filter(name => name && name.trim() !== "").join(", ") || "Sin sucursales"}
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
                                    {w.web ? (
                                        <Badge className="bg-green-400 hover:bg-green-400">Activo</Badge>
                                    ) : (
                                        <Badge className="bg-red-400 hover:bg-red-400">Inactivo</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" asChild>
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