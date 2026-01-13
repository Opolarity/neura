import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    getCategoriesStore,
    getPaginatedCategoriesStore,
    saveCategoryStore,
    deleteCategoryStore
} from '../store/categories';
import { Category, CategoryFilters } from '../products.types';

export const useCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [allCategories, setAllCategories] = useState<Category[]>([]);

    // Pagination & Filters
    const [filters, setFilters] = useState<CategoryFilters>({
        search: '',
        page: 1,
        size: 20
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        size: 20
    });

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
            const [categoriesList, paginatedData] = await Promise.all([
                getCategoriesStore(),
                getPaginatedCategoriesStore(filters)
            ]);

            setAllCategories(categoriesList);
            setCategories(paginatedData.data);
            setPagination({
                total: paginatedData.page.total,
                page: paginatedData.page.page,
                size: paginatedData.page.size
            });
        } catch (error: any) {
            toast.error('Error al cargar datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filters]);

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

    const handleSearchChange = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handlePageSizeChange = (size: number) => {
        setFilters(prev => ({ ...prev, size, page: 1 }));
    };

    return {
        categories,
        loading,
        allCategories,
        filters,
        pagination,
        // Handlers
        handleSearchChange,
        handlePageChange,
        handlePageSizeChange,
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
