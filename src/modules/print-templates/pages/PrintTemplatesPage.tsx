import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CatalogFilterBar } from "@/modules/suppliers/components/CatalogFilterBar";
import { usePrintTemplates } from "../hooks/usePrintTemplates";
import { PrintDocumentsTable } from "../components/PrintDocumentsTable";
import { PrintTemplateFormDialog } from "../components/PrintTemplateFormDialog";
import { PrintTemplatesFilterModal } from "../components/PrintTemplatesFilterModal";
import PrintTemplatesHeader from "../components/PrintTemplatesHeader";

/**
 * Listado de plantillas de impresión (Configuración), por documento: cada
 * PDF del ERP con la plantilla con que se imprime. Por defecto, la del
 * sistema; se elige otra entre las personalizadas del documento, y solo una.
 */
const PrintTemplatesPage = () => {
  const {
    groups,
    loading,
    search,
    setSearch,
    area,
    setArea,
    hasActiveFilters,
    isOpenFilterModal,
    setIsOpenFilterModal,
    isExpanded,
    toggleExpanded,
    changingCode,
    handleUse,
    removing,
    setRemoving,
    confirmRemove,
    busyId,
    handleDuplicate,
    isOpenFormModal,
    setIsOpenFormModal,
    createCode,
    openCreate,
    saving,
    handleCreate,
    openEdit,
    openView,
  } = usePrintTemplates();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <PrintTemplatesHeader onCreate={() => openCreate()} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <CatalogFilterBar
            search={search}
            onSearchChange={setSearch}
            onOpen={() => setIsOpenFilterModal(true)}
            hasActiveFilters={hasActiveFilters}
            placeholder="Buscar documento o plantilla..."
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
          <PrintDocumentsTable
            groups={groups}
            loading={loading}
            isExpanded={isExpanded}
            onToggle={toggleExpanded}
            changingCode={changingCode}
            onUse={handleUse}
            busyId={busyId}
            onView={openView}
            onEdit={openEdit}
            onDuplicate={handleDuplicate}
            onRemove={setRemoving}
            onCreate={openCreate}
          />
        </CardContent>
      </Card>

      <PrintTemplatesFilterModal
        isOpen={isOpenFilterModal}
        onClose={() => setIsOpenFilterModal(false)}
        onApply={setArea}
        area={area}
      />

      <PrintTemplateFormDialog
        open={isOpenFormModal}
        onOpenChange={setIsOpenFormModal}
        saving={saving}
        onSave={handleCreate}
        initialSystemCode={createCode}
      />

      {/* Eliminar: si era la que se usaba, el documento vuelve a la del sistema. */}
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && busyId === null) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar «{removing?.title}»</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.isDefault
                ? "Es la plantilla en uso: el documento se volverá a imprimir con el diseño del sistema."
                : "La plantilla deja de estar disponible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmRemove}
              disabled={busyId !== null}
              className="gap-2"
            >
              {busyId !== null && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrintTemplatesPage;
