import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useProcesses } from "../hooks/useProcesses";
import { useOperationsMasterExport } from "../hooks/useOperationsMasterExport";
import { OperationBlocksTable } from "../components/processes/OperationBlocksTable";
import { CatalogFilterBar } from "../components/CatalogFilterBar";
import { CatalogFilterModal } from "../components/CatalogFilterModal";
import { ProcessCatalogFormDialog } from "../components/processes/ProcessCatalogFormDialog";
import { ProcessCatalogDeleteDialog } from "../components/processes/ProcessCatalogDeleteDialog";
import ProcessesHeader from "../components/processes/ProcessesHeader";

/**
 * Catálogo de OPERACIONES (tabla `processes`).
 *
 * La operación es el trabajo concreto -- tender, trazar, remallar -- y puede
 * agruparse bajo una OPERACIÓN PADRE ("Ensamble"). El listado sale agrupado:
 * cada padre y debajo sus hijas. No lleva precio: lo que se cobra se digita
 * en la orden.
 *
 * Dos altas (2026-10-19): «Nuevo bloque» crea el padre, y «Nueva operación»
 * crea una operación que debe ir en un bloque.
 */
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
    parentOptions,
  } = useProcesses();
  // El maestro de operaciones a Excel, con los filtros de la pantalla.
  const { exporting, exportToExcel } = useOperationsMasterExport({
    search,
    isActive,
    total: pagination.total,
  });
  /** Qué se crea al abrir el formulario sin registro: un bloque o una operación. */
  const [createMode, setCreateMode] = useState<"block" | "operation">("operation");
  // Al editar, el registro dice qué es: sin padre, un bloque; con padre, una operación.
  const formMode = editingItem ? (editingItem.parentProcessId === null ? "block" : "operation") : createMode;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProcessesHeader
        onCreateBlock={() => {
          setCreateMode("block");
          openCreate();
        }}
        onCreateOperation={() => {
          setCreateMode("operation");
          openCreate();
        }}
        onExport={() => void exportToExcel()}
        exporting={exporting}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <CatalogFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setIsOpenFilterModal(true)}
            hasActiveFilters={hasActiveFilters}
            placeholder="Buscar operación por nombre o código..."
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <OperationBlocksTable
            items={items}
            loading={loading}
            expandAll={search.trim() !== ""}
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
        title="Filtrar Operaciones"
      />

      {/* Se monta al abrir para partir siempre del formulario correcto */}
      {isOpenFormModal && (
        <ProcessCatalogFormDialog
          open={isOpenFormModal}
          onOpenChange={setIsOpenFormModal}
          item={editingItem}
          saving={saving}
          onSave={handleSave}
          entityLabel="Operación"
          isFeminine
          namePlaceholder="ej: Tendido"
          parentOptions={parentOptions}
          mode={formMode}
        />
      )}

      <ProcessCatalogDeleteDialog
        item={deletingItem}
        isDeleting={deleting}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        entityLabel="operación"
        isFeminine
      />
    </div>
  );
};

export default ProcessesList;
