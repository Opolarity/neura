import { useState } from 'react';
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
import { UsersDeleteDialog } from '../components/users/UsersDeleteDialog';
import type { Users } from '../types/Users.types';
import { ComponentPermission } from '@/shared/components/component-permission';


const UsersList = () => {
  const navigate = useNavigate();
  const [userToDelete, setUserToDelete] = useState<Users | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    await handleDeleteUser(userToDelete.profiles_id);
    setIsDeleting(false);
    setUserToDelete(null);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listado de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Administra los usuarios del sistema
          </p>
        </div>
        {/* El botón lleva a /settings/users/create, ya protegida con
            users.create: se reutiliza ese code para no ofrecer un botón que
            acaba en una pantalla bloqueada. */}
        <ComponentPermission codeIn={["users.create"]}>
          <Button asChild className="gap-2">
            <Link to="/settings/users/create">
              <Plus className="w-4 h-4" />
              Crear Usuario
            </Link>
          </Button>
        </ComponentPermission>
      </div>

      {/* Users Table */}
      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <UsersFilterBar
            search={search}
            handleSearchChange={handleSearchChange}
            onFilterClick={handleOpenFilterModal}
            order={filters.order}
            onOrderChange={(val) => handleApplyFilter({ ...filters, order: val })}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <UsersTable
            users={users}
            loading={loading}
            onEdit={(user) => navigate(`/settings/users/edit/${user.profiles_id}`)}
            onDeleteClick={setUserToDelete}
          />
        </CardContent>
        <CardFooter className="!p-0">
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

      <UsersDeleteDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default UsersList;
