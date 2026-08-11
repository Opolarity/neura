import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
    <div className="h-full min-h-0 flex flex-col gap-4">
      <RolesHeader />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <RolesFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={handleOpenFilterModal}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <RolesTable
            roles={roles}
            loading={loading}
            onDeleteClick={handleDeleteRole}
            handleEditRole={handleEditRole}
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
