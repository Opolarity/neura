import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useProcesses } from "../hooks/useProcesses";
import { ProcessCatalogTable } from "../components/processes/ProcessCatalogTable";
import { ProcessCatalogFilterBar } from "../components/processes/ProcessCatalogFilterBar";
import { ProcessCatalogFilterModal } from "../components/processes/ProcessCatalogFilterModal";
import { ProcessCatalogFormDialog } from "../components/processes/ProcessCatalogFormDialog";
import { ProcessCatalogDeleteDialog } from "../components/processes/ProcessCatalogDeleteDialog";
import ProcessesHeader from "../components/processes/ProcessesHeader";

const ProcessesList = () => {
  const {
    items,
    pagination,
    loading,
    search,
    isActive,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    isOpenFilterModal,
    setIsOpenFilterModal,
    isOpenFormModal,
    setIsOpenFormModal,
    editingItem,
    saving,
    openCreate,
    openEdit,
    handleSave,
    deletingItem,
    setDeletingItem,
    deleting,
    handleDelete,
    groupOptions,
  } = useProcesses();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProcessesHeader onCreate={openCreate} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader>
          <ProcessCatalogFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setIsOpenFilterModal(true)}
            hasActiveFilters={hasActiveFilters}
            placeholder="Buscar proceso por nombre o código..."
          />
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProcessCatalogTable
              items={items}
              loading={loading}
              entityLabel="proceso"
              showGroup
              onEdit={openEdit}
              onDelete={setDeletingItem}
            />
          </div>
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      <ProcessCatalogFilterModal
        isOpen={isOpenFilterModal}
        onClose={() => setIsOpenFilterModal(false)}
        onApply={handleApplyFilters}
        isActive={isActive}
        title="Filtrar Procesos"
      />

      {/* Se monta al abrir para partir siempre del formulario correcto */}
      {isOpenFormModal && (
        <ProcessCatalogFormDialog
          open={isOpenFormModal}
          onOpenChange={setIsOpenFormModal}
          item={editingItem}
          saving={saving}
          onSave={handleSave}
          entityLabel="Proceso"
          namePlaceholder="ej: Lavado"
          codePlaceholder="ej: LAV"
          groupOptions={groupOptions}
        />
      )}

      <ProcessCatalogDeleteDialog
        item={deletingItem}
        isDeleting={deleting}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        entityLabel="proceso"
      />
    </div>
  );
};

export default ProcessesList;
