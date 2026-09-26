import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useProcessGroups } from "../hooks/useProcessGroups";
import { ProcessCatalogTable } from "../components/processes/ProcessCatalogTable";
import { CatalogFilterBar } from "../components/CatalogFilterBar";
import { CatalogFilterModal } from "../components/CatalogFilterModal";
import { ProcessCatalogFormDialog } from "../components/processes/ProcessCatalogFormDialog";
import { ProcessCatalogDeleteDialog } from "../components/processes/ProcessCatalogDeleteDialog";
import ProcessGroupsHeader from "../components/processes/ProcessGroupsHeader";

/**
 * Catálogo de PROCESOS (tabla `process_group`).
 *
 * El proceso es la etapa de fabricación -- Corte, Confección, Acabados -- que
 * agrupa operaciones. El backend existía desde el primer día del módulo; lo que
 * faltaba era esta pantalla, así que los procesos solo se podían elegir, nunca
 * administrar.
 *
 * Sin columna de agrupación: un proceso no cuelga de otro.
 */
const ProcessGroupsList = () => {
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
  } = useProcessGroups();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProcessGroupsHeader onCreate={openCreate} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <CatalogFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setIsOpenFilterModal(true)}
            hasActiveFilters={hasActiveFilters}
            placeholder="Buscar proceso por nombre o código..."
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ProcessCatalogTable
            items={items}
            loading={loading}
            entityLabel="proceso"
            onEdit={openEdit}
            onDelete={setDeletingItem}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <CatalogFilterModal
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
          namePlaceholder="ej: Corte"
          codePlaceholder="ej: COR"
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

export default ProcessGroupsList;
