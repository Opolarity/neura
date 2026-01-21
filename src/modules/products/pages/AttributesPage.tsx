import { useState } from "react";
import { useAttributes } from "../hooks/useAttributes";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash } from "lucide-react";
import AttributesHeader from "../components/attributes/AttributesHeader";
import AttributesFilterBar from "../components/attributes/AttributesFilterBar";
import AttributesFilterModal from "../components/attributes/AttributesFilterModal";
import AttributeFormDialog from "../components/attributes/AttributeFormDialog";
import TermFormDialog from "../components/attributes/TermFormDialog";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

interface DeleteConfirmation {
  id: number;
  type: "group" | "term";
  name: string;
}

const AttributesPage = () => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  
  const {
    attributes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onResetFilters,
    // Form modal for attribute
    isOpenFormModal,
    saving,
    loadingEdit,
    editingAttribute,
    onOpenNewAttribute,
    onCloseFormModal,
    onEditAttribute,
    onSaveAttribute,
    // Form modal for term
    isOpenTermModal,
    savingTerm,
    editingTerm,
    termGroups,
    onOpenNewTerm,
    onCloseTermModal,
    onEditTerm,
    onSaveTerm,
    // Delete handlers
    deleting,
    onDeleteAttribute,
    onDeleteTerm,
  } = useAttributes();

  const handleNewAttribute = () => {
    onOpenNewAttribute();
  };

  const handleNewTerm = () => {
    onOpenNewTerm();
  };

  const handleEdit = (id: number, type: "group" | "term") => {
    if (type === "group") {
      onEditAttribute(id);
    } else {
      onEditTerm(id);
    }
  };

  const handleDeleteClick = (id: number, type: "group" | "term", name: string) => {
    setDeleteConfirmation({ id, type, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === "group") {
      await onDeleteAttribute(deleteConfirmation.id);
    } else {
      await onDeleteTerm(deleteConfirmation.id);
    }
    setDeleteConfirmation(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-5 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <AttributesHeader
        onNewAttribute={handleNewAttribute}
        onNewTerm={handleNewTerm}
      />

      <Card>
        <CardHeader>
          <AttributesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cantidad de Productos</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : attributes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron atributos
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((row) => (
                  <TableRow 
                    key={`${row.type}-${row.id}`}
                    className={
                      row.type === "group"
                        ? "bg-muted/50 [&>td]:py-4"
                        : "[&>td]:py-2"
                    }
                  >
                    <TableCell>
                      {row.type === "group" ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{row.name}</span>
                          <Badge variant="outline" className="text-xs">
                            ATRIBUTO
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-muted-foreground">•</span>
                          <span>{row.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">
                      —
                    </TableCell>
                    <TableCell>{row.products} productos</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loadingEdit}
                          onClick={() => handleEdit(row.id, row.type)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting}
                          onClick={() => handleDeleteClick(row.id, row.type, row.name)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <AttributesFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
        onReset={onResetFilters}
      />

      <AttributeFormDialog
        open={isOpenFormModal}
        onOpenChange={onCloseFormModal}
        initialData={editingAttribute}
        onSubmit={onSaveAttribute}
        saving={saving}
      />

      <TermFormDialog
        open={isOpenTermModal}
        onOpenChange={onCloseTermModal}
        initialData={editingTerm}
        termGroups={termGroups}
        onSubmit={onSaveTerm}
        saving={savingTerm}
      />

      <AlertDialog open={!!deleteConfirmation} onOpenChange={handleCancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.type === "group" ? (
                <>
                  Se eliminará el atributo <strong>"{deleteConfirmation?.name}"</strong> y todos sus términos asociados. Esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  Se eliminará el término <strong>"{deleteConfirmation?.name}"</strong>. Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttributesPage;
