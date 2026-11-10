import { Check, KeyRound, Loader2, Minus } from 'lucide-react';
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
    /** Si llega, se muestra la columna Acciones con "Acceso a la cuenta". */
    onAccountAccess?: (account: Account) => void;
}

export const AccountsTable = ({ accounts, loading, onAccountAccess }: AccountsTableProps) => {
    const showActions = Boolean(onAccountAccess);
    const colSpan = showActions ? 9 : 8;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo doc.</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tiene cuenta</TableHead>
                    <TableHead className="text-center">Compras</TableHead>
                    <TableHead className="text-right">Monto Gastado</TableHead>
                    <TableHead>Estado</TableHead>
                    {showActions && <TableHead>Acciones</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && accounts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={colSpan} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando clientes...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : accounts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={colSpan} className="text-center text-muted-foreground p-10">
                            No se encontraron cuentas
                        </TableCell>
                    </TableRow>
                ) : (
                    accounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.id}</TableCell>
                            <TableCell>{account.fullName}</TableCell>
                            <TableCell>{account.documentTypeName || '—'}</TableCell>
                            <TableCell>{account.documentNumber || '—'}</TableCell>
                            <TableCell>
                                {account.hasAccount ? (
                                    <span title="Tiene cuenta" aria-label="Tiene cuenta">
                                        <Check className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground" title="Sin cuenta" aria-label="Sin cuenta">
                                        <Minus className="w-4 h-4" />
                                    </span>
                                )}
                            </TableCell>
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
                                        <Badge variant="success">
                                            Activo
                                        </Badge>
                                    )}
                                    {account.show === false && (
                                        <Badge variant="destructive">
                                            Inactivo
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            {showActions && (
                                <TableCell>
                                    {account.canManageAccess && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Acceso a la cuenta"
                                                aria-label="Acceso a la cuenta"
                                                onClick={() => onAccountAccess?.(account)}
                                            >
                                                <KeyRound className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
