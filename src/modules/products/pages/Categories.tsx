import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
import productPlaceholder from "@/assets/product-placeholder.png";
import { useCategories } from "../hooks/useCategories";
import { useCategoriesPageLogic } from "../store/Categories.logic";
import { CategoryFormModal } from "../components/modals/CategoryFormModal";
import { CategoryDeleteDialog } from "../components/CategoryDeleteDialog";

const Categories = () => {
  const { categories, productCounts, loading, reload } = useCategories();
  const {
    isModalOpen,
    formData,
    setFormData,
    editingCategory,
    saving,
    openCreateModal,
    handleModalClose,
    handleSave,
    handleEdit,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    removeImage,
    deleteDialogOpen,
    setDeleteDialogOpen,
    categoryToDelete,
    deleting,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useCategoriesPageLogic(reload);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Cargando categorias...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay categorias registradas.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <img
                        src={category.image_url || productPlaceholder}
                        alt={category.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>{productCounts[category.id] || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
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
      </Card>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        formData={formData}
        setFormData={setFormData}
        editingCategory={editingCategory}
        saving={saving}
        onSave={handleSave}
        imagePreview={imagePreview}
        fileInputRef={fileInputRef}
        onImageSelect={handleImageSelect}
        onRemoveImage={removeImage}
      />

      <CategoryDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={categoryToDelete}
        productCount={categoryToDelete ? productCounts[categoryToDelete.id] || 0 : 0}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Categories;
