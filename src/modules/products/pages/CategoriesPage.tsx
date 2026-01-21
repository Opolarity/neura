import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

import { Category } from "../types/Categories.types";
import CategoriesHeader from "../components/categories/CategoriesHeader";
import CategoriesFilterBar from "../components/categories/CategoriesFilterBar";
import CategoriesFilterModal from "../components/categories/CategoriesFilterModal";
import { useCategories } from "../hooks/useCategories";
import { CategoryFormDialog } from "../components/categories/CategoryFormDialog";
import { CategoryDeleteDialog } from "../components/categories/CategoryDeleteDialog";
import { CategoryFormValues } from "../utils/CategorySchema";
import CategoriesTable from "../components/categories/CategoriesTable";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

const Categories = () => {
  const {
    categories,
    categoriesList,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryFormValues | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  // Async Process States
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredParentCategories = useMemo(() => {
    return categoriesList.filter(
      (category) => category.id !== editingCategory?.id,
    );
  }, [categoriesList, editingCategory]);

  // Extract storage path from public URL
  const extractPathFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/products\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateOrUpdate = async (data: CategoryFormValues) => {
    try {
      setSaving(true);

      let imageUrl = data.image_url;

      // Handle Image Upload if a new file is present
      if (data.image && data.image instanceof File) {
        // Delete old image if updating with a new one
        if (editingCategory?.image_url) {
          const oldPath = extractPathFromUrl(editingCategory.image_url);
          if (oldPath) {
            await supabase.storage.from('products').remove([oldPath]);
          }
        }
        imageUrl = await uploadImage(data.image);
      }
      // Handle Image Removal (had image before, now doesn't)
      else if (editingCategory?.image_url && !data.image_url && !data.image) {
        const oldPath = extractPathFromUrl(editingCategory.image_url);
        if (oldPath) {
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove([oldPath]);

          if (storageError) {
            console.warn('Error al eliminar imagen del storage:', storageError);
          }
        }
        imageUrl = null;
      }

      if (editingCategory?.id) {
        await updateCategory({
          id: editingCategory.id,
          name: data.name,
          description: data.description || null,
          parent_category: data.parent_category || null,
          image_url: imageUrl || null,
        });
        toast.success("Categoría actualizada exitosamente");
      } else {
        await createCategory({
          name: data.name,
          description: data.description || null,
          parent_category: data.parent_category || null,
          image_url: imageUrl || null,
        });
        toast.success("Categoría creada exitosamente");
      }
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(
        "Error al guardar categoría: " + (error.message || "Error desconocido"),
      );
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (category: Category) => {
    // Find parent ID logic
    let parentId = category.parent_id;
    if (!parentId && category.parent_category) {
      const parentFound = categoriesList.find(
        (c) => c.name === category.parent_category,
      );
      if (parentFound) {
        parentId = parentFound.id;
      }
    }

    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      parent_category: parentId,
      image_url: category.image,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleting(true);

      // Delete image from storage if exists
      if (categoryToDelete.image) {
        const imagePath = extractPathFromUrl(categoryToDelete.image);
        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove([imagePath]);

          if (storageError) {
            console.warn('Error al eliminar imagen del storage:', storageError);
          }
        }
      }

      await deleteCategory(categoryToDelete.id);
      toast.success("Categoría eliminada exitosamente");
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(
        "Error al eliminar categoría: " +
        (error.message || "Error desconocido"),
      );
    } finally {
      setDeleting(false);
    }
  };

  // Derived state for delete dialog
  const deleteChildCount = useMemo(() => {
    if (!categoryToDelete) return 0;
    return categoriesList.filter(
      (c) => c.parent_category === categoryToDelete.id,
    ).length;
  }, [categoryToDelete, categoriesList]);

  return (
    <div className="p-6">
      <CategoriesHeader onOpen={openCreateDialog} />

      <Card>
        <CardHeader>
          <CategoriesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          <CategoriesTable
            categories={categories}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <CategoriesFilterModal
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
        filters={filters}
      />

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingCategory}
        parentCategories={filteredParentCategories}
        onSubmit={handleCreateOrUpdate}
        saving={saving}
      />

      <CategoryDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        category={categoryToDelete}
        childCount={deleteChildCount}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
      />
    </div>
  );
};

export default Categories;
