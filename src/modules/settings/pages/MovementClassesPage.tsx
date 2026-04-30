import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMovementClasses } from "../hooks/useMovementClasses";
import MovementClassesTable from "../components/movement-classes/MovementClassesTable";
import { MovementClassFormDialog } from "../components/movement-classes/MovementClassFormDialog";

const MovementClassesPage = () => {
  const {
    classes,
    loading,
    saving,
    editingItem,
    openFormModal,
    pagination,
    handleEditItemChange,
    handleOpenChange,
    saveMovementClass,
    handlePageChange,
    handlePageSizeChange,
  } = useMovementClasses();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clases de Movimiento</h1>
          <p className="text-muted-foreground mt-2">
            Administra las clases de movimiento del sistema
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
          Crear Clase
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <MovementClassesTable
            loading={loading}
            classes={classes}
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
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

      <MovementClassFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        onSaved={saveMovementClass}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default MovementClassesPage;
