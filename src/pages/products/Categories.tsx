import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import React, {useEffect, useState, useRef} from "react";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Plus, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import productPlaceholder from "@/assets/product-placeholder.png";

const Categories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try{
            setLoading(true);
            const { data: categoriesData, error: categoriesError} = await supabase.from('categories').select('*').neq('id',0);
            if (categoriesError) throw categoriesError;
            setCategories(categoriesData);
        } catch (error: any) {
            toast.error('Error al cargar categorías: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

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
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            const { error } = await supabase
                .from('categories')
                .insert([{
                    name: newCategory.name,
                    description: newCategory.description || null,
                    image_url: imageUrl
                }]);

            if (error) throw error;

            toast.success('Categoría creada exitosamente');
            setIsModalOpen(false);
            setNewCategory({ name: '', description: '' });
            setSelectedImage(null);
            setImagePreview('');
            fetchCategories();
        } catch (error: any) {
            toast.error('Error al crear categoría: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de categorías</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir categoría
        </Button>
      </div>
        <Card>
        <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Productos</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            Cargando categorias...
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
                                src={category.image_url || productPlaceholder} 
                                alt={category.name}
                                className="w-16 h-16 object-cover rounded-md"
                            />
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>-</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        </CardContent>
        </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Añadir Categoría</DialogTitle>
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
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    );
};

export default Categories