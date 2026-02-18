import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useRoles from "../hooks/useRoles";
import RolesFilterBar from "../components/roles/RolesFilterBar";
import RolesTable from "../components/roles/RolesTable";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import RolesFilterModal from "../components/roles/RolesFilterModal";
import RolesHeader from "../components/roles/RolesHeader";
import { RolesDeleteDialog } from "../components/roles/RolesDeleteDialog";

const RolesList = () => {
  const {
    roles,
    loading,
    filters,
    search,
    isOpenFilterModal,
    pagination,
    isOpenDeleteModal,
    selectedRole,
    deleting,
    hasActiveFilters,
    handleCloseDeleteModal,
    handleDeleteConfirm,
    handleDeleteRole,
    handleEditRole,
    handleSearchChange,
    handleOpenFilterModal,
    handleCloseFilterModal,
    handlePageChange,
    handleSizeChange,
    handleApplyFilter,
  } = useRoles();

  return (
    <div className="space-y-6">
      <RolesHeader />

      <Card>
        <CardHeader>
          <RolesFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={handleOpenFilterModal}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable
            roles={roles}
            loading={loading}
            onDeleteClick={handleDeleteRole}
            handleEditRole={handleEditRole}
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
      <RolesDeleteDialog
        open={isOpenDeleteModal}
        onOpenChange={(open) => !open && handleCloseDeleteModal()}
        role={selectedRole}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleting}
      />
    </div>
  );
};

export default RolesList;
