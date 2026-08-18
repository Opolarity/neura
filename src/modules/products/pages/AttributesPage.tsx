import { Fragment, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Edit, Loader2, Trash } from "lucide-react";
import AttributesHeader from "../components/attributes/AttributesHeader";
import AttributesFilterBar from "../components/attributes/AttributesFilterBar";
import AttributesFilterModal from "../components/attributes/AttributesFilterModal";
import AttributeFormDialog from "../components/attributes/AttributeFormDialog";
import TermFormDialog from "../components/attributes/TermFormDialog";
import { AttributeDeleteDialog } from "../components/attributes/AttributeDeleteDialog";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { ComponentPermission } from "@/shared/components/component-permission";
import { useAuth } from "@/modules/auth";

interface DeleteConfirmation {
  id: number;
  type: "group" | "term";
  name: string;
}

// Nombre, Términos, Cantidad de Productos, Acciones. Si el rol no tiene
// ninguna acción, la columna de Acciones no se pinta y este número queda uno
// largo: solo afecta a las filas de "cargando" y "no se encontraron", y la
// columna sobrante colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 4;

// Codes de la columna Acciones. La columna es UNA SOLA para las filas de
// atributo y las de término, así que la cabecera y las dos celdas miran los
// cuatro codes: si cada una mirara solo los suyos, un rol con permisos de
// atributo pero no de término dejaría las filas de término sin td y la tabla
// se desalinearía. Dentro de cada celda, cada botón lleva el suyo.
const ACTION_CODES = [
  "product_attributes.edit",
  "product_attributes.delete",
  "product_terms.edit",
  "product_terms.delete",
];

const AttributesPage = () => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const { permissionCodes, permissionsLoading, isAdmin } = useAuth();

  // Misma regla que ComponentPermission, pero aquí hace falta como booleano y
  // no como envoltorio: no basta con ocultar el chevron, hay que quitar
  // también el onClick de la fila y no pintar las filas de términos. Mientras
  // cargan los codes va en false, igual que ComponentPermission no renderiza
  // nada hasta saber qué tiene concedido el rol.
  const canListTerms =
    !permissionsLoading &&
    (isAdmin || permissionCodes.includes("product_terms.list"));

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


  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <AttributesHeader
        onNewAttribute={onOpenNewAttribute}
        onNewTerm={onOpenNewTerm}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <AttributesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Términos</TableHead>
                <TableHead>Cantidad de Productos</TableHead>
                {/* Se envuelve el th entero y no su texto: una celda vacía
                    sigue ocupando su ancho y deja un hueco muerto. */}
                <ComponentPermission codeIn={ACTION_CODES}>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </ComponentPermission>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COL_SPAN} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando atributos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : attributes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_SPAN}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron atributos
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((group) => {
                  // Sin product_terms.list no hay despliegue posible, así que
                  // la fila nunca se da por expandida aunque el estado del
                  // hook dijera lo contrario.
                  const isExpanded =
                    canListTerms && expandedGroups.has(group.group_id);
                  const totalProducts = group.terms.reduce((sum, t) => sum + t.products, 0);

                  return (
                    <Fragment key={`group-${group.group_id}`}>
                      {/* Group row */}
                      <TableRow
                        className={`bg-muted/50 [&>td]:py-3 ${
                          canListTerms ? "cursor-pointer hover:bg-muted/70" : ""
                        }`}
                        onClick={
                          canListTerms
                            ? () => toggleGroup(group.group_id)
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* El chevron se va con el click: dejar la flecha
                                sin poder desplegar haría creer que la fila
                                está rota. */}
                            {canListTerms &&
                              (isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              ))}
                            <span className="font-semibold">{group.group_name}</span>
                            {group.group_description && (
                              <span className="text-xs text-muted-foreground font-normal">
                                {group.group_description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {group.terms.length} {group.terms.length === 1 ? "término" : "términos"}
                        </TableCell>
                        <TableCell className="text-sm">{totalProducts} productos</TableCell>
                        <ComponentPermission codeIn={ACTION_CODES}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <ComponentPermission
                                codeIn={["product_attributes.edit"]}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loadingEdit}
                                  onClick={() => handleEdit(group.group_id, "group")}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </ComponentPermission>
                              <ComponentPermission
                                codeIn={["product_attributes.delete"]}
                              >
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleting}
                                  onClick={() => handleDeleteClick(group.group_id, "group", group.group_name)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </ComponentPermission>
                            </div>
                          </TableCell>
                        </ComponentPermission>
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
                            <ComponentPermission codeIn={ACTION_CODES}>
                              <TableCell>
                                <div className="flex gap-2">
                                  <ComponentPermission
                                    codeIn={["product_terms.edit"]}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={loadingEdit}
                                      onClick={() => handleEdit(term.id, "term")}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </ComponentPermission>
                                  <ComponentPermission
                                    codeIn={["product_terms.delete"]}
                                  >
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleting}
                                      onClick={() => handleDeleteClick(term.id, "term", term.name)}
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </ComponentPermission>
                                </div>
                              </TableCell>
                            </ComponentPermission>
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="!p-0">
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

      <AttributeDeleteDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && handleCancelDelete()}
        deleteConfirmation={deleteConfirmation}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
      />
    </div>
  );
};

export default AttributesPage;
