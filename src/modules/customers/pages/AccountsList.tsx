import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useAccounts } from '../hooks/useAccounts';
import { AccountsFilterBar } from '../components/AccountsFilterBar';
import { AccountsTable } from '../components/AccountsTable';
import { AccountFilterModal } from '../components/AccountFilterModal';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';

const AccountsList = () => {
    const navigate = useNavigate();

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const {
        accounts,
        pagination,
        loading,
        search,
        order,
        filters,
        hasActiveFilters,
        handleOrderChange,
        handleSearchChange,
        handleFiltersChange,
        handlePageChange,
        handlePageSizeChange,
        clearFilters,
        accountTypes,
    } = useAccounts();


    const handleOpenFilterModal = () => {
        setIsFilterModalOpen(true);
    };

    return (
        <div className="p-6">
            <AccountFilterModal
                filters={filters}
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleFiltersChange}
                onClear={clearFilters}
                accountTypes={accountTypes}
            />
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Listado de Cuentas</h1>
                    <p className="text-muted-foreground">Administra tus cuentas</p>
                </div>
            </div>

            {/* Tabla */}
            <Card>

                <CardHeader>
                    {/* Barra de búsqueda */}
                    <AccountsFilterBar
                        search={search}
                        order={order}
                        onSearchChange={handleSearchChange}
                        onOpen={handleOpenFilterModal}
                        hasActiveFilters={hasActiveFilters}
                        handleOrderChange={handleOrderChange}
                    />
                </CardHeader>


                <CardContent className="p-0">
                    <AccountsTable
                        accounts={accounts}
                        loading={loading}

                    />

                    {/* Paginación */}
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountsList;
