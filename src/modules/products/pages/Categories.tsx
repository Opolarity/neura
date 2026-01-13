import React from "react";
import ProductHeader from "../components/ProductHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "../hooks/useCategories";
import CategoryTable from "../components/categories/CategoryTable";
import CategoryModal from "../components/categories/CategoryModal";
import DeleteCategoryDialog from "../components/categories/DeleteCategoryDialog";

const Categories = () => {
  const {
    categories,
    loading,
    allCategories,
    filters,
    pagination,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
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
    <div className="space-y-6">
      <ProductHeader
        title="Listado de categorías"
        onAddClick={() => handleOpenModal()}
      />

      <Card>
        <CardContent className="p-0">
          <CategoryTable
            categories={categories}
            loading={loading}
            search={filters.search || ""}
            onSearchChange={handleSearchChange}
            pagination={{
              total: pagination.total,
              page: pagination.page,
              pageSize: pagination.size
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
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
        categories={allCategories}
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
        productCount={categoryToDelete ? categories.find(c => c.name === categoryToDelete.name)?.product_count || 0 : 0}
        deleting={deleting}
      />
    </div>
  );
};

export default Categories;
