import React from 'react';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useCategories } from '../hooks/useCategories';
import { useCategoriesPageLogic } from '../store/CategoriesList.logic';
import {
  CategoriesSearchBar,
  CategoriesTable,
  CategoriesPagination,
  CategoriesFilterModal,
} from '../components/categories';

const Categories = () => {
  // Data hook
  const {
    categories,
    pagination,
    minProducts,
    maxProducts,
    loading,
    search,
    order,
    filters,
    pageSize,
    handleSearchChange,
    handleOrderChange,
    handleFiltersChange,
    handlePageChange,
    handlePageSizeChange,
    hasActiveFilters,
    reload,
  } = useCategories();

  // UI logic hook
  const {
    isFilterModalOpen,
    tempFilters,
    openFilterModal,
    closeFilterModal,
    updateTempFilters,
    clearTempFilters,
    isCategoryModalOpen,
    editingCategory,
    openCreateModal,
    openEditModal,
    closeCategoryModal,
    isDeleteDialogOpen,
    categoryToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    formData,
    updateFormData,
    imagePreview,
    saving,
    deleting,
    fileInputRef,
    handleImageSelect,
    clearImage,
    handleSave,
    handleDeleteConfirm,
  } = useCategoriesPageLogic(reload);

  const handleApplyFilters = () => {
    handleFiltersChange(tempFilters);
    closeFilterModal();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>

      <CategoriesSearchBar
        search={search}
        order={order}
        hasActiveFilters={hasActiveFilters()}
        onSearchChange={handleSearchChange}
        onOrderChange={handleOrderChange}
        onFilterClick={() => openFilterModal(filters)}
      />

      <Card>
        <CardContent className="p-0">
          <CategoriesTable
            categories={categories}
            loading={loading}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
          />
        </CardContent>
      </Card>

      <CategoriesPagination
        pagination={pagination}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <CategoriesFilterModal
        open={isFilterModalOpen}
        filters={tempFilters}
        minProductsRange={minProducts}
        maxProductsRange={maxProducts}
        onClose={closeFilterModal}
        onFiltersChange={updateTempFilters}
        onApply={handleApplyFilters}
        onClear={clearTempFilters}
      />

      <Dialog open={isCategoryModalOpen} onOpenChange={closeCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar categoría' : 'Añadir Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Nombre de la categoría"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Descripción de la categoría"
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={saving}
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar imagen
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCategoryModal} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingCategory ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : editingCategory ? (
                'Actualizar'
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && categoryToDelete.productCount > 0 ? (
                <>
                  Esta categoría cuenta con {categoryToDelete.productCount} producto(s)
                  vinculado(s). ¿Aún así deseas borrarla? Esta acción no se puede deshacer
                  y se eliminarán todos los vínculos con productos.
                </>
              ) : (
                'Esta acción no se puede deshacer. Se eliminará la categoría de forma permanente.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
