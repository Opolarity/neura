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
import { ChevronRight, ChevronDown, Edit, Trash } from "lucide-react";
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
    expandedGroups,
    toggleGroup,
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
    isOpenFormModal,
    saving,
    loadingEdit,
    editingAttribute,
    hasActiveFilters,
    onOpenNewAttribute,
    onCloseFormModal,
    onEditAttribute,
    onSaveAttribute,
    isOpenTermModal,
    savingTerm,
    editingTerm,
    termGroups,
    onOpenNewTerm,
    onCloseTermModal,
    onEditTerm,
    onSaveTerm,
    deleting,
    onDeleteAttribute,
    onDeleteTerm,
  } = useAttributes();

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

  const renderSkeletonRows = () =>
    Array.from({ length: 6 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
      </TableRow>
    ));

  return (
    <div className="space-y-6">
      <AttributesHeader
        onNewAttribute={onOpenNewAttribute}
        onNewTerm={onOpenNewTerm}
      />

      <Card>
        <CardHeader>
          <AttributesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Términos</TableHead>
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
                attributes.map((group) => {
                  const isExpanded = expandedGroups.has(group.group_id);
                  const totalProducts = group.terms.reduce((sum, t) => sum + t.products, 0);

                  return (
                    <>
                      {/* Group row */}
                      <TableRow
                        key={`group-${group.group_id}`}
                        className="bg-muted/50 cursor-pointer hover:bg-muted/70 [&>td]:py-3"
                        onClick={() => toggleGroup(group.group_id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-semibold">{group.group_name}</span>
                            <Badge variant="outline" className="text-xs">
                              ATRIBUTO
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {group.terms.length} {group.terms.length === 1 ? "término" : "términos"}
                        </TableCell>
                        <TableCell className="text-sm">{totalProducts} productos</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingEdit}
                              onClick={() => handleEdit(group.group_id, "group")}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleting}
                              onClick={() => handleDeleteClick(group.group_id, "group", group.group_name)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Term rows (only when expanded) */}
                      {isExpanded &&
                        group.terms.map((term) => (
                          <TableRow
                            key={`term-${term.id}`}
                            className="[&>td]:py-2"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2 pl-8">
                                <span className="text-muted-foreground">•</span>
                                <span>{term.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground italic text-sm">
                              —
                            </TableCell>
                            <TableCell className="text-sm">{term.products} productos</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loadingEdit}
                                  onClick={() => handleEdit(term.id, "term")}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleting}
                                  onClick={() => handleDeleteClick(term.id, "term", term.name)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </>
                  );
                })
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
