import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentMethod } from '../../types/PaymentMethods.types';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodsTableProps {
    paymentMethods: PaymentMethod[];
    loading: boolean;
}

const PaymentMethodsTable = ({ paymentMethods, loading }: PaymentMethodsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta de Negocio </TableHead>
                    <TableHead>Estado</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando métodos de pago...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : paymentMethods.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            Inactivo
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )
                }
            </TableBody>
        </Table>
    );
};

export default PaymentMethodsTable;
