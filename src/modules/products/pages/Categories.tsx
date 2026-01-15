import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Edit, Trash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import productPlaceholder from "@/assets/product-placeholder.png";
import { Category, CategoryPayload } from "../types/Categories.types";
import CategoriesHeader from "../components/CategoriesHeader";
import CategoriesFilterBar from "../components/CategoriesFilterBar";
import CategoriesFilterModal from "../components/CategoriesFilterModal";
import { useCategories } from "../hooks/useCategories";
import ProductsPagination from "../components/ProductsPagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    loadData,
    createCategory,
    updateCategory,
  } = useCategories();

  // Component local states for UI management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryPayload>({ name: '', description: '', parent_category: null, image_url: null });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [editingCategory, setEditingCategory] = useState<CategoryPayload | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);

      let imageUrl = null;

      // Si se seleccionó una nueva imagen, subirla
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      // Si no hay nueva imagen pero hay preview, mantener la anterior (si es una URL remota)
      else if (imagePreview && !imagePreview.startsWith('data:')) {
        imageUrl = editingCategory?.image_url || null;
      }
      // Si no hay preview ni selectedImage, significa que se eliminó o no había (imageUrl queda null)

      if (editingCategory?.id) {
        // Actualizar categoría existente mediante el hook
        await updateCategory({
          ...newCategory,
          id: editingCategory.id,
          image_url: imageUrl
        });
        toast.success('Categoría actualizada exitosamente');
      } else {
        // Crear nueva categoría mediante el hook
        await createCategory({
          ...newCategory,
          image_url: imageUrl
        });
        toast.success('Categoría creada exitosamente');
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setNewCategory({ name: '', description: '', image_url: null, parent_category: null });
      setSelectedImage(null);
      setImagePreview('');
      await loadData(filters);
    } catch (error: any) {
      toast.error('Error al guardar categoría: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: any) => {
    // category viene de la tabla y tiene 'id', 'name', 'description', 'image'
    // Intentamos recuperar el ID del padre. Si no viene directo (parent_id), lo buscamos por nombre
    let parentId = category.parent_id;

    if (!parentId && category.parent_category) {
      const parentFound = categoriesList.find(c => c.name === category.parent_category);
      if (parentFound) {
        parentId = parentFound.id;
      }
    }

    const payload: CategoryPayload = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image_url: category.image || null,
      parent_category: parentId || null
    };

    setEditingCategory(payload);
    setNewCategory(payload);
    setImagePreview(category.image || '');
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
      const { data, error } = await supabase.functions.invoke('delete-category', {
        body: { categoryId: categoryToDelete.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Categoría eliminada exitosamente');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await loadData(filters);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Error al eliminar categoría: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', image_url: null, parent_category: null });
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <CategoriesHeader
        onOpen={onOpenModal}
      />

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Padre</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando categorias...
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay categorias registradas.
                  </TableCell>
                </TableRow>
              ) : categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <img
                      src={category.image || productPlaceholder}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  </TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell>{category.parent_category}</TableCell>
                  <TableCell>{category.products}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <ProductsPagination
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

      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar categoría' : 'Añadir Categoría'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Nombre de la categoría"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descripción de la categoría"
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Categoría Padre</Label>
              <Select
                value={newCategory.parent_category ? newCategory.parent_category.toString() : "none"}
                onValueChange={(value) => setNewCategory({ ...newCategory, parent_category: value === "none" ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las categorías</SelectItem>
                  {categoriesList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    className="w-full h-48 object-contain rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
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
            <Button
              variant="outline"
              onClick={handleModalClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingCategory ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingCategory ? 'Actualizar' : 'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && productCounts[categoryToDelete.id] > 0 ? (
                <>
                  Esta categoría cuenta con {productCounts[categoryToDelete.id]} producto(s) vinculado(s).
                  ¿Aún así deseas borrarla? Esta acción no se puede deshacer y se eliminarán todos los
                  vínculos con productos.
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