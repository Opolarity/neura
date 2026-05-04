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
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import ReturnsFilterBar from './ReturnsFilterBar';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import { PaginationState } from '@/shared/components/pagination/Pagination';

interface ReturnsTableProps {
    returns: ReturnItem[];
    loading: boolean;
    formatDate: (date: string) => string;
    formatCurrency: (amount: number | null) => string;
    search: string;
    onSearchChange: (value: string) => void;
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const getSituationClassName = (code?: string): string => {
    switch (code?.toLowerCase()) {
        case "cfm": return "bg-teal-400 hover:bg-teal-500 text-white";
        case "com": return "bg-green-500 hover:bg-green-600 text-white";
        case "pen": return "bg-yellow-400 hover:bg-yellow-500 text-white";
        case "drf": return "bg-cyan-200 hover:bg-cyan-300 text-cyan-900";
        case "can": return "bg-red-500 hover:bg-red-600 text-white";
        case "phy": return "bg-blue-400 hover:bg-blue-500 text-white";
        case "hdn": return "bg-gray-400 hover:bg-gray-500 text-white";
        default:    return "bg-muted text-muted-foreground";
    }
};

export const ReturnsTable = ({ returns, loading, formatDate, formatCurrency, search, onSearchChange, pagination, onPageChange, onPageSizeChange }: ReturnsTableProps) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <ReturnsFilterBar search={search} onSearchChange={onSearchChange} />
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Reembolso</TableHead>
                                <TableHead>Total de orden</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && returns.length === 0 ? (
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
                                    <TableCell>{returnItem.customer_document_number?.trim() || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {returnItem.types?.name || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getSituationClassName(returnItem.situations?.code)}>
                                            {returnItem.situations?.name || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={returnItem.total_refund_amount < 0 ? 'text-red-500 font-medium' : returnItem.total_refund_amount > 0 ? 'text-emerald-500 font-medium' : ''}>
                                            {formatCurrency(returnItem.total_refund_amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(returnItem.total_exchange_difference)}
                                    </TableCell>
                                    <TableCell>{formatDate(returnItem.created_at)}</TableCell>
                                    <TableCell>
                                        {returnItem.customer_name} {returnItem.customer_lastname}
                                    </TableCell>
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
                </CardContent>
                <CardFooter>
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                    />
                </CardFooter>
            </Card>
        </div>
    );
};
