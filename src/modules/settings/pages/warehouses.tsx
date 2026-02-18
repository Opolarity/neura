import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import { CardFooter } from '@/components/ui/card';
import WarehousesTable from '../components/warehouses/WarehousesTable';
import useWarehouses from '../hooks/useWarehouses';
import WarehousesFilterBar from '../components/warehouses/WrehousesFilterBar';
import WarehouserFilterModal from '../components/warehouses/WarehousesFilterModal';
import { WarehouseDeleteDialog } from '../components/warehouses/WarehouseDeleteDialog';
import type { WarehouseView } from '../types/Warehouses.types';



const WarehousesList = () => {
    const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { warehouses, loading, pagination, search, filters, isOpenFilterModal, hasActiveFilters, handleCloseFilterModal, handleOpenFilterModal, handlePageChange, handleSizeChange, handleSearchChange, handleApplyFilter, handleDeleteWarehouse } = useWarehouses();

    const handleConfirmDelete = async () => {
        if (!warehouseToDelete) return;
        setIsDeleting(true);
        await handleDeleteWarehouse(warehouseToDelete.id);
        setIsDeleting(false);
        setWarehouseToDelete(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listado de Almacenes</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra los almacenes del sistema
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link to="/settings/warehouses/create">
                        <Plus className="w-4 h-4" />
                        Crear Almacén
                    </Link>
                </Button>
            </div>


            {/* Warehouses Filter Modal */}
            <WarehouserFilterModal
                filters={filters}
                isOpen={isOpenFilterModal}
                onClose={handleCloseFilterModal}
                onApply={handleApplyFilter}
            />
            {/* Warehouses Table */}
            <Card>
                <CardHeader>
                    <WarehousesFilterBar
                        search={search}
                        onSearchChange={handleSearchChange}
                        onOpen={handleOpenFilterModal}
                        hasActiveFilters={hasActiveFilters}
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <WarehousesTable
                        warehouses={warehouses}
                        loading={loading}
                        onDeleteClick={setWarehouseToDelete}
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

            <WarehouseDeleteDialog
                open={!!warehouseToDelete}
                onOpenChange={(open) => !open && setWarehouseToDelete(null)}
                warehouse={warehouseToDelete}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default WarehousesList;
