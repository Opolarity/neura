import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useRoles from '../hooks/useRoles';
import RolesFilterBar from '../components/RolesFilterBar';
import RolesTable from '../components/RolesTable';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import RolesFilterModal from '../components/RolesFilterModal';

const RolesList = () => {
  const {
    roles,
    loading,
    filters,
    search,
    isOpenFilterModal,
    pagination,
    handleDeleteRole,
    handleSearchChange,
    handleOpenFilterModal,
    handleCloseFilterModal,
    handlePageChange,
    handleSizeChange,
    handleApplyFilter
  } = useRoles();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listado de Roles</h1>
          <p className="text-muted-foreground mt-2">
            Administra los roles del sistema y sus funciones asignadas
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/settings/roles/create">
            <Plus className="w-4 h-4" />
            Nuevo Rol
          </Link>
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <RolesFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={handleOpenFilterModal}
          />
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable
            roles={roles}
            loading={loading}
            handleDeleteRole={handleDeleteRole}
          />
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handleSizeChange}
          />
        </CardContent>
      </Card>

      <RolesFilterModal
        isOpen={isOpenFilterModal}
        onClose={handleCloseFilterModal}
        filters={filters}
        onApply={handleApplyFilter}
      />
    </div>
  );
};

export default RolesList;
