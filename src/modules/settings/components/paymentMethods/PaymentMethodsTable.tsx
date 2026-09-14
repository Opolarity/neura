import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMethod } from '../../types/PaymentMethods.types';
import { Edit, Loader2, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComponentPermission } from '@/shared/components/component-permission';

// ID, Nombre, Cuenta de Negocio, Estado, Acciones. Si el rol no puede editar ni
// eliminar, la columna de Acciones no se pinta y este número queda uno largo:
// solo afecta a las filas de "cargando" y "no se encontraron", y la columna
// sobrante colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 5;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["payment_methods.edit", "payment_methods.delete"];

interface PaymentMethodsTableProps {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    onEditItem: (item: PaymentMethod) => void;
    onOpenChange: (open: boolean) => void;
    onDeleteClick: (item: PaymentMethod) => void;
}

const PaymentMethodsTable = ({
    paymentMethods,
    loading,
    onEditItem,
    onOpenChange,
    onDeleteClick,
}: PaymentMethodsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta de Negocio </TableHead>
                    <TableHead>Estado</TableHead>
                    {/* Se envuelve el th entero y no su texto: una celda vacía sigue
                        ocupando su ancho y deja un hueco muerto. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead className="text-center w-28">Acciones</TableHead>
                    </ComponentPermission>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando métodos de pago...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : paymentMethods.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground">
                                No se encontraron métodos de pago
                            </TableCell>
                        </TableRow>
                    ) : (
                        paymentMethods.map((method) => (
                            <TableRow key={method.id}>
                                <TableCell className="font-mono text-sm">{method.id}</TableCell>
                                <TableCell>{method.name}</TableCell>
                                <TableCell className="font-mono text-sm">{method.business_account_id}</TableCell>
                                <TableCell>
                                    {method.active ? (
                                        <Badge variant="success">
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            Inactivo
                                        </Badge>
                                    )}
                                </TableCell>
                                <ComponentPermission codeIn={ACTION_CODES}>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <ComponentPermission codeIn={["payment_methods.edit"]}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Editar el método de pago"
                                                    onClick={() => {
                                                        onEditItem(method);
                                                        onOpenChange(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </ComponentPermission>
                                            <ComponentPermission codeIn={["payment_methods.delete"]}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    title="Eliminar el método de pago"
                                                    onClick={() => onDeleteClick(method)}
                                                >
                                                    <Trash className="h-4 w-4" />
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

export default PaymentMethodsTable;
