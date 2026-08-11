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

const getSituationClassName = (code: string): string => {
    switch (code.toLowerCase()) {
        case "cfm": return "bg-info hover:bg-info/80 text-info-foreground";
        case "com": return "bg-success hover:bg-success/80 text-success-foreground";
        case "pen": return "bg-warning hover:bg-warning/80 text-warning-foreground";
        case "drf": return "bg-info/15 hover:bg-info/25 text-info";
        case "can": return "bg-destructive hover:bg-destructive/80 text-destructive-foreground";
        case "phy": return "bg-info hover:bg-info/80 text-info-foreground";
        case "hdn": return "bg-pending hover:bg-pending/80 text-pending-foreground";
        default:    return "bg-muted text-muted-foreground";
    }
};

export const ReturnsTable = ({ returns, loading, formatDate, formatCurrency, search, onSearchChange, pagination, onPageChange, onPageSizeChange }: ReturnsTableProps) => {
    const navigate = useNavigate();

    return (
        <Card className="flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="!p-4">
                <ReturnsFilterBar search={search} onSearchChange={onSearchChange} />
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
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
                                    <Badge className={returnItem.status?.code ? getSituationClassName(returnItem.status.code) : "bg-muted text-muted-foreground"}>
                                        {returnItem.situations?.name || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className={returnItem.total_refund_amount < 0 ? 'text-destructive font-medium' : returnItem.total_refund_amount > 0 ? 'text-success font-medium' : ''}>
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
            <CardFooter className="!p-0">
                <PaginationBar
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            </CardFooter>
        </Card>
    );
};
