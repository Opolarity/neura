import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useRoles from "../hooks/useRoles";
import RolesFilterBar from "../components/RolesFilterBar";
import RolesTable from "../components/RolesTable";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import RolesFilterModal from "../components/RolesFilterModal";

const RolesList = () => {
  const {
    roles,
    loading,
    filters,
    search,
    isOpenFilterModal,
    pagination,
    isOpenDeleteModal,
    deleting,
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
          />
        </CardHeader>
        <CardContent className="p-0">
          <RolesTable
            roles={roles}
            loading={loading}
            handleDeleteRole={handleDeleteRole}
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
      <RolesDeleteModal
        isOpen={isOpenDeleteModal}
        onClose={handleCloseDeleteModal}
        deleting={deleting}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default RolesList;
