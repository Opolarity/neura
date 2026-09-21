import { Card, CardContent, CardFooter } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMaterialClasses } from "../hooks/useMaterialClasses";
import { MaterialClassesHeader } from "../components/material-classes/MaterialClassesHeader";
import { MaterialClassesTable } from "../components/material-classes/MaterialClassesTable";
import { MaterialClassFormDialog } from "../components/material-classes/MaterialClassFormDialog";

/**
 * El catálogo de clases de materiales.
 *
 * Hasta ahora una clase solo nacía a mitad de dar de alta un material, desde el
 * bloque en línea de su formulario. Eso servía para no abandonar la receta,
 * pero dejaba el catálogo sin ningún sitio donde mirarse entero: para saber qué
 * familias había que empezar a crear un material y no guardarlo.
 *
 * El reparto es el de la pantalla de atributos de producto: **una fila por
 * familia**, lo de dentro al desplegar, y la paginación sobre las familias. Así
 * la página corta por donde no duele — un color de jersey no puede acabar en
 * otra página que su jersey.
 */
const MaterialClassesList = () => {
  const {
    pageRoots,
    descendantsOf,
    expanded,
    toggle,
    pagination,
    onPageChange,
    onPageSizeChange,
    tree,
    loading,
    saving,
    editing,
    dialogOpen,
    setDialogOpen,
    openCreate,
    openEdit,
    save,
  } = useMaterialClasses();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <MaterialClassesHeader onCreate={openCreate} />

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <MaterialClassesTable
            roots={pageRoots}
            descendantsOf={descendantsOf}
            expanded={expanded}
            onToggle={toggle}
            loading={loading}
            onEdit={openEdit}
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

      <MaterialClassFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        tree={tree}
        saving={saving}
        onSave={save}
      />
    </div>
  );
};

export default MaterialClassesList;
