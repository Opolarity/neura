import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2 } from "lucide-react";
import { Category } from "../../products.types";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    category: Category | null;
    categories: Category[]; // Add this
    saving: boolean;
    formData: { name: string; description: string; parent_id: number | null }; // Update this
    setFormData: (data: { name: string; description: string; parent_id: number | null }) => void; // Update this
    imagePreview: string;
    setImagePreview: (url: string) => void;
    setSelectedImage: (file: File | null) => void;
}

const CategoryModal = ({
    isOpen,
    onClose,
    onSave,
    category,
    categories,
    saving,
    formData,
    setFormData,
    imagePreview,
    setImagePreview,
    setSelectedImage
}: CategoryModalProps) => {
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{category ? 'Editar categoría' : 'Añadir Categoría'}</DialogTitle>
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
                        <Label htmlFor="parent_id">Categoría Padre</Label>
                        <Select
                            disabled={saving}
                            value={formData.parent_id?.toString() || "none"}
                            onValueChange={(value) => setFormData({
                                ...formData,
                                parent_id: value === "none" ? null : parseInt(value)
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una categoría padre (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguna (Categoría Raíz)</SelectItem>
                                {categories
                                    .filter(c => c.id !== category?.id) // Prevent self-parenting
                                    .map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))
                                }
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
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={onSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {category ? 'Actualizando...' : 'Guardando...'}
                            </>
                        ) : (
                            category ? 'Actualizar' : 'Guardar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryModal;
