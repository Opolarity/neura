import React from "react";
import { Button } from '@/components/ui/button';
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "../hooks/useCategories";
import CategoryTable from "../components/categories/CategoryTable";
import CategoryModal from "../components/categories/CategoryModal";
import DeleteCategoryDialog from "../components/categories/DeleteCategoryDialog";

const Categories = () => {
  const {
    categories,
    loading,
    productCounts,
    isModalOpen,
    editingCategory,
    saving,
    formData,
    setFormData,
    imagePreview,
    setImagePreview,
    setSelectedImage,
    handleOpenModal,
    handleCloseModal,
    handleSave,
    deleteDialogOpen,
    setDeleteDialogOpen,
    categoryToDelete,
    deleting,
    handleDeleteClick,
    handleDeleteConfirm
  } = useCategories();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <CategoryTable
            categories={categories}
            loading={loading}
            productCounts={productCounts}
            onEdit={handleOpenModal}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        category={editingCategory}
        categories={categories}
        saving={saving}
        formData={formData}
        setFormData={setFormData}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        setSelectedImage={setSelectedImage}
      />

      <DeleteCategoryDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        categoryName={categoryToDelete?.name || ''}
        productCount={categoryToDelete ? productCounts[categoryToDelete.id] || 0 : 0}
        deleting={deleting}
      />
    </div>
  );
};

export default Categories;
