import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useClients } from '../hooks/useClients';
import { useClientsPage } from '../hooks/useClientsPage';
import { ClientsSearchBar } from '../components/ClientsSearchBar';
import { ClientsTable } from '../components/ClientsTable';
import { ClientsPaginationBar } from '../components/ClientsPagination';
import { ClientsFilterModal } from '../components/modals/ClientsFilterModal';

const ClientsList = () => {
  const navigate = useNavigate();
  
  const {
    clients,
    pagination,
    loading,
    searchInput,
    filters,
    order,
    hasActiveFilters,
    handleSearchInputChange,
    executeSearch,
    handleFiltersChange,
    handleOrderChange,
    handlePageChange,
    handlePageSizeChange,
    clearFilters,
  } = useClients();

  const logic = useClientsPage({
    filters,
    order,
    hasActiveFilters,
    onFiltersChange: handleFiltersChange,
    onOrderChange: handleOrderChange,
    clearFilters,
  });

  const handleEdit = (clientId: number) => {
    navigate(`/customers/edit/${clientId}`);
  };

  const handleDelete = (clientId: number) => {
    // Por el momento no hace nada
    console.log('Delete client:', clientId);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Listado de Clientes</h1>
          <p className="text-muted-foreground">Administra tus clientes</p>
        </div>
        <Button onClick={() => navigate('/customers/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Cliente
        </Button>
      </div>

      {/* Barra de búsqueda, orden y filtros */}
      <ClientsSearchBar
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
        onSearch={executeSearch}
        order={order}
        onOrderChange={handleOrderChange}
        onFilterClick={logic.openFilterModal}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <ClientsTable
            clients={clients}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          {/* Paginación */}
          <ClientsPaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Modal de filtros */}
      <ClientsFilterModal
        isOpen={logic.isFilterModalOpen}
        onClose={logic.closeFilterModal}
        filters={logic.tempFilters}
        onFilterChange={logic.updateTempFilter}
        onApply={logic.applyFilters}
        onClear={logic.handleClearFilters}
      />
    </div>
  );
};

export default ClientsList;
