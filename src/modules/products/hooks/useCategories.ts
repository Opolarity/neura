import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Category, CategoryProductCount } from '../products.types';
import {
    getCategoriesStore,
    getProductCountsStore,
    saveCategoryStore,
    deleteCategoryStore
} from '../store/categories';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [productCounts, setProductCounts] = useState<Record<number, number>>({});

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({ name: '', description: '', parent_id: null as number | null });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Delete states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesData, countsData] = await Promise.all([
                getCategoriesStore(),
                getProductCountsStore()
            ]);

            setCategories(categoriesData);

            const countsMap: Record<number, number> = {};
            countsData.forEach((item: CategoryProductCount) => {
                countsMap[item.category_id] = item.product_count;
            });
            setProductCounts(countsMap);
        } catch (error: any) {
            toast.error('Error al cargar datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                parent_id: category.parent_id || null,
            });
            setImagePreview(category.image_url || '');
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', parent_id: null });
            setImagePreview('');
        }
        setSelectedImage(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', parent_id: null });
        setSelectedImage(null);
        setImagePreview('');
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            setSaving(true);
            await saveCategoryStore(
                {
                    ...editingCategory,
                    name: formData.name,
                    description: formData.description,
                    parent_id: formData.parent_id
                },
                selectedImage
            );

            toast.success(editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
            handleCloseModal();
            loadData();
        } catch (error: any) {
            toast.error('Error al guardar categoría: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        setDeleting(true);
        try {
            await deleteCategoryStore(categoryToDelete.id);
            toast.success('Categoría eliminada exitosamente');
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            loadData();
        } catch (error: any) {
            toast.error('Error al eliminar categoría: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    return {
        categories,
        loading,
        productCounts,
        // Modal & Form
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
        // Delete
        deleteDialogOpen,
        setDeleteDialogOpen,
        categoryToDelete,
        deleting,
        handleDeleteClick,
        handleDeleteConfirm,
        refreshData: loadData
    };
};
