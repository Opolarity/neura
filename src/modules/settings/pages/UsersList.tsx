import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import UsersTable from '../components/users/UsersTable';
import useUsers from '../hooks/useUsers';
import UsersFilterBar from '../components/users/UsersFilterBar';
import UsersFilterModal from '../components/users/UsersFilterModal';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import { CardFooter } from '@/components/ui/card';
import UsersDeleteModal from '../components/users/UsersDeleteModal';


const UsersList = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const {
    users,
    loading,
    filters,
    search,
    isOpenFilterModal,
    pagination,
    hasActiveFilters,
    handleSizeChange,
    handlePageChange,
    handleSearchChange,
    handleOpenFilterModal,
    handleCloseFilterModal,
    handleApplyFilter,
    handleDeleteUser,
    rolesOptions,
    warehousesOptions,
    branchesOptions
  } = useUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listado de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/settings/users/create">
            <Plus className="w-4 h-4" />
            Crear Usuario
          </Link>
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <UsersFilterBar
            search={search}
            handleSearchChange={handleSearchChange}
            onFilterClick={handleOpenFilterModal}
            order={filters.order}
            onOrderChange={(val) => handleApplyFilter({ ...filters, order: val })}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable
            users={users}
            loading={loading}
            onEdit={(user) => navigate(`/settings/users/create?id=${user.id}`)}
            onDelete={(id) => setDeleteId(id)}
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

      <UsersFilterModal
        filters={filters}
        isOpen={isOpenFilterModal}
        onClose={handleCloseFilterModal}
        onApply={handleApplyFilter}
        rolesOptions={rolesOptions}
        warehousesOptions={warehousesOptions}
        branchesOptions={branchesOptions}
      />

      <UsersDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        loading={isDeleting}
        onConfirm={async () => {
          if (deleteId) {
            setIsDeleting(true);
            await handleDeleteUser(deleteId);
            setIsDeleting(false);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
};

export default UsersList;