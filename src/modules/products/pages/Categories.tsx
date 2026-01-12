import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
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
import {
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../services/Categories.service';

const Categories = () => {
  // Hook for data fetching
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
    clearFilters,
    hasActiveFilters,
    reload,
  } = useCategories();

  // Logic for modals and UI state
  const {
    isFilterModalOpen,
    tempFilters,
    openFilterModal,
    closeFilterModal,
    updateTempFilters,
    isCategoryModalOpen,
    editingCategory,
    openCreateModal,
    openEditModal,
    closeCategoryModal,
    isDeleteDialogOpen,
    categoryToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  } = useCategoriesPageLogic();

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle opening edit modal with data
  const handleEdit = (category: typeof categories[0]) => {
    setFormData({
      name: category.name,
      description: category.description === 'sin descripción' ? '' : category.description,
    });
    setImagePreview(category.imageUrl || '');
    openEditModal(category);
  };

  // Handle opening create modal
  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview('');
    openCreateModal();
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle save category
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      let imageUrl = editingCategory?.imageUrl || null;

      if (selectedImage) {
        imageUrl = await uploadCategoryImage(selectedImage);
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || null,
          image_url: imageUrl,
        });
        toast.success('Categoría actualizada exitosamente');
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description || null,
          image_url: imageUrl,
        });
        toast.success('Categoría creada exitosamente');
      }

      closeCategoryModal();
      setFormData({ name: '', description: '' });
      setSelectedImage(null);
      setImagePreview('');
      reload();
    } catch (error: any) {
      toast.error('Error al guardar categoría: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      await deleteCategory(categoryToDelete.id);
      toast.success('Categoría eliminada exitosamente');
      closeDeleteDialog();
      reload();
    } catch (error: any) {
      toast.error('Error al eliminar categoría: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Handle modal close with cleanup
  const handleModalClose = () => {
    closeCategoryModal();
    setFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    handleFiltersChange(tempFilters);
    closeFilterModal();
  };

  // Handle clear filters in modal
  const handleClearFiltersInModal = () => {
    updateTempFilters({
      minProducts: null,
      maxProducts: null,
      hasDescription: null,
      hasImage: null,
      isParent: null,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>

      {/* Search and filters bar */}
      <CategoriesSearchBar
        search={search}
        order={order}
        hasActiveFilters={hasActiveFilters()}
        onSearchChange={handleSearchChange}
        onOrderChange={handleOrderChange}
        onFilterClick={() => openFilterModal(filters)}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <CategoriesTable
            categories={categories}
            loading={loading}
            onEdit={handleEdit}
            onDelete={openDeleteDialog}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <CategoriesPagination
        pagination={pagination}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Filter Modal */}
      <CategoriesFilterModal
        open={isFilterModalOpen}
        filters={tempFilters}
        minProductsRange={minProducts}
        maxProductsRange={maxProducts}
        onClose={closeFilterModal}
        onFiltersChange={updateTempFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFiltersInModal}
      />

      {/* Create/Edit Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={handleModalClose}>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
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
            <Button variant="outline" onClick={handleModalClose} disabled={saving}>
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

      {/* Delete Dialog */}
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
