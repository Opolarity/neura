import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, SquarePen } from 'lucide-react';
import { ReturnItem } from '../../types/Returns.types';
import { Card } from '@/components/ui/card';


interface ReturnsTableProps {
    returns: ReturnItem[];
    loading: boolean;
    formatDate: (date: string) => string;
    formatCurrency: (amount: number | null) => string;
}

export const ReturnsTable = ({ returns, loading, formatDate, formatCurrency }: ReturnsTableProps) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Reembolso</TableHead>
                            <TableHead>Diferencia</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cargando devoluciones...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : returns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                    No se encontraron devoluciones
                                </TableCell>
                            </TableRow>
                        ) : returns.map((returnItem) => (
                            <TableRow key={returnItem.id}>
                                <TableCell className="font-medium">#{returnItem.id}</TableCell>
                                <TableCell>#{returnItem.order_id}</TableCell>
                                <TableCell>
                                    {returnItem.customer_name} {returnItem.customer_lastname}
                                </TableCell>
                                <TableCell>{returnItem.customer_document_number}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {returnItem.types?.name || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge>
                                        {returnItem.situations?.name || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {formatCurrency(returnItem.total_refund_amount)}
                                </TableCell>
                                <TableCell>
                                    <span className={returnItem.total_exchange_difference < 0 ? 'text-red-500 font-medium' : returnItem.total_exchange_difference > 0 ? 'text-emerald-500 font-medium' : ''}>
                                        {formatCurrency(returnItem.total_exchange_difference)}
                                    </span>
                                </TableCell>
                                <TableCell>{formatDate(returnItem.created_at)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/returns/edit/${returnItem.id}`)}
                                        >
                                            <SquarePen className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
