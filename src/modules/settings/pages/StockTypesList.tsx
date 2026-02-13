import { Card, CardContent, CardFooter } from '@/components/ui/card';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import StockTypesTable from '../components/stockTypes/StockTypesTable';
import useStockTypes from '../hooks/useStockTypes';

const StockTypesList = () => {
    const {
        stockTypes,
        loading,
        pagination,
        handlePageChange,
        handleSizeChange,
    } = useStockTypes();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tipos de Stock</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra los tipos de stock del sistema
                    </p>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <StockTypesTable
                        stockTypes={stockTypes}
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

export default StockTypesList;
