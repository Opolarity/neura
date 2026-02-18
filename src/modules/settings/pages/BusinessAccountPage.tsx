import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useBusinessAccount } from "../hooks/useBusinessAccount";
import { BusinessAccountFormDialog } from "../components/business-account/BusinessAccountFormDialog";
import { BusinessAccountDeleteDialog } from "../components/business-account/BusinessAccountDeleteDialog";
import BusinessAccountTable from "../components/business-account/BusinessAccountTable";

const BusinessAccountPage = () => {
  const {
    businessAccounts,
    editingItem,
    itemToDelete,
    openFormModal,
    loading,
    saving,
    isDeleting,
    pagination,
    handleEditItemChange,
    setItemToDelete,
    saveBusinessAccount,
    deleteBusinessAccount,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  } = useBusinessAccount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cuentas de Negocio
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las cuentas de negocio del sistema
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            handleEditItemChange(null);
            handleOpenChange(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Crear Cuenta de Negocio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <BusinessAccountTable
            loading={loading}
            businessAccounts={businessAccounts}
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
            onDeleteClick={setItemToDelete}
          />
        </CardContent>
        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <BusinessAccountFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        onSaved={saveBusinessAccount}
        onOpenChange={handleOpenChange}
      />

      <BusinessAccountDeleteDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        item={itemToDelete}
        onConfirm={() => itemToDelete && deleteBusinessAccount(itemToDelete.id)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default BusinessAccountPage;
