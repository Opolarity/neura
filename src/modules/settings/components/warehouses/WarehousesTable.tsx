import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WarehouseView } from '../../types/Warehouses.types';
import { ComponentPermission } from '@/shared/components/component-permission';

// ID, Nombre, Locales, Pais, Ciudad, Provincia, Distrito, Web, Acciones. Si el
// rol no puede editar ni eliminar, la columna de Acciones no se pinta y este
// número queda uno largo: solo afecta a las filas de "cargando" y "no se
// encontraron almacenes", y la columna sobrante colapsa a 0px porque ninguna
// otra fila la ocupa.
//
// Antes ponía 8, uno MENOS que las columnas reales, así que esas dos filas no
// llegaban a cubrir la última columna.
const COL_SPAN = 9;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["warehouses.edit", "warehouses.delete"];

interface WarehousesTableProps {
    warehouses: WarehouseView[];
    loading: boolean;
    onDeleteClick: (warehouse: WarehouseView) => void;
}

const WarehousesTable = ({ warehouses, loading, onDeleteClick }: WarehousesTableProps) => {
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
                    {/* Se envuelve el th entero y no su texto: una celda vacía
                        sigue ocupando su ancho y deja un hueco muerto. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead>Acciones</TableHead>
                    </ComponentPermission>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading && warehouses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando almacenes...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : warehouses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground">
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
                                        <Badge variant="success">Activo</Badge>
                                    ) : (
                                        <Badge variant="destructive">Inactivo</Badge>
                                    )}
                                </TableCell>
                                <ComponentPermission codeIn={ACTION_CODES}>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {/* El botón lleva a /settings/warehouses/edit/:id,
                                                ya protegida con warehouses.edit: se reutiliza
                                                ese code. */}
                                            <ComponentPermission codeIn={["warehouses.edit"]}>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/settings/warehouses/edit/${w.id}`}>
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </ComponentPermission>

                                            <ComponentPermission codeIn={["warehouses.delete"]}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => onDeleteClick(w)}
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

export default WarehousesTable;