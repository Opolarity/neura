import { useState, useRef } from "react";
import { toast } from "sonner";
import { Category, CategoryFormData } from "../types";
import { createCategory, updateCategory, deleteCategory, uploadCategoryImage } from "../services";

export const useCategoriesPageLogic = (reload: () => Promise<void>) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // CRUD handlers
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      setSaving(true);
      let imageUrl = editingCategory?.image_url || null;

      if (selectedImage) {
        imageUrl = await uploadCategoryImage(selectedImage);
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, formData.name, formData.description || null, imageUrl);
        toast.success("Categoría actualizada exitosamente");
      } else {
        await createCategory(formData.name, formData.description || null, imageUrl);
        toast.success("Categoría creada exitosamente");
      }

      handleModalClose();
      await reload();
    } catch (error: any) {
      toast.error("Error al guardar categoría: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setImagePreview(category.image_url || "");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success("Categoría eliminada exitosamente");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await reload();
    } catch (error: any) {
      toast.error("Error al eliminar categoría: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => setIsModalOpen(true);

  return {
    // Modal
    isModalOpen,
    formData,
    setFormData,
    editingCategory,
    saving,
    openCreateModal,
    handleModalClose,
    handleSave,
    handleEdit,
    // Image
    imagePreview,
    fileInputRef,
    handleImageSelect,
    removeImage,
    // Delete
    deleteDialogOpen,
    setDeleteDialogOpen,
    categoryToDelete,
    deleting,
    handleDeleteClick,
    handleDeleteConfirm,
  };
};
