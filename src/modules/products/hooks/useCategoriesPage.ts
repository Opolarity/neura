import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  CategoriesFilters, 
  defaultCategoriesFilters,
  Category 
} from '../types/Categories.type';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../services/Categories.service';

interface FormData {
  name: string;
  description: string;
}

export const useCategoriesPage = (reload: () => void) => {
  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<CategoriesFilters>(defaultCategoriesFilters);

  // Category modal state (create/edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({ name: '', description: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter modal handlers
  const openFilterModal = useCallback((currentFilters: CategoriesFilters) => {
    setTempFilters(currentFilters);
    setIsFilterModalOpen(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const updateTempFilters = useCallback((updates: Partial<CategoriesFilters>) => {
    setTempFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearTempFilters = useCallback(() => {
    setTempFilters({
      minProducts: null,
      maxProducts: null,
      hasDescription: null,
      hasImage: null,
      isParent: null,
    });
  }, []);

  // Form reset helper
  const resetForm = useCallback(() => {
    setFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Category modal handlers
  const openCreateModal = useCallback(() => {
    resetForm();
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((category: Category) => {
    setFormData({
      name: category.name,
      description: category.description === 'sin descripción' ? '' : category.description,
    });
    setImagePreview(category.imageUrl || '');
    setSelectedImage(null);
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    resetForm();
  }, [resetForm]);

  // Delete dialog handlers
  const openDeleteDialog = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  }, []);

  // Form handlers
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // CRUD handlers
  const handleSave = useCallback(async () => {
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
      reload();
    } catch (error: any) {
      toast.error('Error al guardar categoría: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, selectedImage, editingCategory, closeCategoryModal, reload]);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [categoryToDelete, closeDeleteDialog, reload]);

  return {
    // Filter modal
    isFilterModalOpen,
    tempFilters,
    openFilterModal,
    closeFilterModal,
    updateTempFilters,
    clearTempFilters,

    // Category modal
    isCategoryModalOpen,
    editingCategory,
    openCreateModal,
    openEditModal,
    closeCategoryModal,

    // Delete dialog
    isDeleteDialogOpen,
    categoryToDelete,
    openDeleteDialog,
    closeDeleteDialog,

    // Form state
    formData,
    updateFormData,
    selectedImage,
    imagePreview,
    saving,
    deleting,
    fileInputRef,

    // Form handlers
    handleImageSelect,
    clearImage,
    handleSave,
    handleDeleteConfirm,
  };
};
