import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import OrderChannelTypesTable from '../components/orderChannelTypes/OrderChannelTypesTable';
import useOrderChannelTypes from '../hooks/useOrderChannelTypes';
import { TableCell, TableHead } from '@/components/ui/table';

const OrderChannelTypesList = () => {
    const {
        orderChannelTypes,
        loading,
        pagination,
        handlePageChange,
        handleSizeChange,
    } = useOrderChannelTypes();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tipos de Canales de Pedido</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra los tipos de canales de pedido del sistema
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link to="/settings/order-channel-types/create">
                        <Plus className="w-4 h-4" />
                        Crear Tipo de Canal
                    </Link>
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <OrderChannelTypesTable
                        orderChannelTypes={orderChannelTypes}
                        loading={loading}
                    />
                </CardContent>
                <CardFooter>
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handleSizeChange}
                    />
                </CardFooter>
            </Card>
        </div>
    );
};

export default OrderChannelTypesList;
