import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Account } from '../types/accounts.types';
import { formatCurrency } from '@/shared/utils/currency';

interface AccountsTableProps {
    accounts: Account[];
    loading: boolean;

}

export const AccountsTable = ({ accounts, loading }: AccountsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Compras</TableHead>
                    <TableHead className="text-right">Monto Gastado</TableHead>
                    <TableHead>Estado</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-muted-foreground">Cargando cuentas...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : accounts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground p-10">
                            No se encontraron cuentas
                        </TableCell>
                    </TableRow>
                ) : (
                    accounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.id}</TableCell>
                            <TableCell>{account.fullName}</TableCell>
                            <TableCell>{account.documentNumber}</TableCell>
                            <TableCell>{account.typeName}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant="secondary">
                                    {account.totalPurchases}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(account.totalSpent)}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {account.show === true && (
                                        <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">
                                            Activo
                                        </Badge>
                                    )}
                                    {account.show === false && (
                                        <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/20">
                                            Inactivo
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
