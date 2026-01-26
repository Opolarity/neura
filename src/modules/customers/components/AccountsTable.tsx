import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Account } from '../types/accounts.types';

interface AccountsTableProps {
    accounts: Account[];
    loading: boolean;
    onEdit: (accountId: number) => void;
}

export const AccountsTable = ({ accounts, loading, onEdit }: AccountsTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center w-28">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground p-10">
                            Cargando cuentas...
                        </TableCell>
                    </TableRow>
                ) : accounts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground p-10">
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
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button variant="outline"
                                        size="sm">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
