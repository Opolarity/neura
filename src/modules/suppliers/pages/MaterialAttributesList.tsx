import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMaterialTerms } from "../hooks/useMaterialTerms";
import { MaterialTermsHeader } from "../components/material-terms/MaterialTermsHeader";
import { MaterialTermsTable } from "../components/material-terms/MaterialTermsTable";
import { MaterialTermGroupDialog } from "../components/material-terms/MaterialTermGroupDialog";
import { MaterialTermDialog } from "../components/material-terms/MaterialTermDialog";
import { MaterialTermDeleteDialog } from "../components/material-terms/MaterialTermDeleteDialog";

/**
 * El catálogo de atributos de material: Color, Largo, Talla… y sus términos.
 *
 * Es lo que distingue a dos variaciones del mismo material ("Jersey 30/1 ·
 * Negro" y "Jersey 30/1 · Blanco"). Sin él, la única forma de separarlas era
 * crear una clase por color, que es justo lo que confundía clases con
 * materiales.
 */
const MaterialAttributesList = () => {
  const {
    groups,
    pageGroups,
    loading,
    search,
    onSearchChange,
    expanded,
    toggle,
    pagination,
    onPageChange,
    onPageSizeChange,
    saving,
    groupDialogOpen,
    setGroupDialogOpen,
    editingGroup,
    openCreateGroup,
    openEditGroup,
    saveGroup,
    termDialogOpen,
    setTermDialogOpen,
    editingTerm,
    termGroupId,
    openCreateTerm,
    openEditTerm,
    saveTerm,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
  } = useMaterialTerms();

  const [inputValue, setInputValue] = useState(search);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <MaterialTermsHeader
        onCreateGroup={openCreateGroup}
        onCreateTerm={() => openCreateTerm(null)}
      />

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="!p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchChange(inputValue)}
              placeholder="Buscar atributo o término..."
              className="max-w-sm"
            />
            <Button variant="outline" onClick={() => onSearchChange(inputValue)} aria-label="Buscar">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <MaterialTermsTable
            groups={pageGroups}
            expanded={expanded}
            onToggle={toggle}
            loading={loading}
            onEditGroup={openEditGroup}
            onDeleteGroup={(item) => setDeleteTarget({ kind: "group", item })}
            onCreateTerm={openCreateTerm}
            onEditTerm={openEditTerm}
            onDeleteTerm={(item) => setDeleteTarget({ kind: "term", item })}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <MaterialTermGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editing={editingGroup}
        saving={saving}
        onSave={saveGroup}
      />

      <MaterialTermDialog
        open={termDialogOpen}
        onOpenChange={setTermDialogOpen}
        editing={editingTerm}
        groupId={termGroupId}
        groups={groups}
        saving={saving}
        onSave={saveTerm}
      />

      <MaterialTermDeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />
    </div>
  );
};

export default MaterialAttributesList;
