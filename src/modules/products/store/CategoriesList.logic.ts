import { useState, useCallback } from 'react';
import { 
  CategoriesFilters, 
  defaultCategoriesFilters,
  Category 
} from '../types/Categories.type';

export const useCategoriesPageLogic = () => {
  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<CategoriesFilters>(defaultCategoriesFilters);

  // Category modal state (create/edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

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

  // Category modal handlers
  const openCreateModal = useCallback(() => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  }, []);

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  }, []);

  // Delete dialog handlers
  const openDeleteDialog = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  }, []);

  return {
    // Filter modal
    isFilterModalOpen,
    tempFilters,
    openFilterModal,
    closeFilterModal,
    updateTempFilters,

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
  };
};
