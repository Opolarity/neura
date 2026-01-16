import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2 } from "lucide-react";
import {
    CategoryFormValues,
    categorySchema,
} from "../../utils/CategorySchema";
import { SimpleCategory } from "../../types/Categories.types";

interface CategoryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: CategoryFormValues | null;
    parentCategories: SimpleCategory[];
    onSubmit: (data: CategoryFormValues) => Promise<void>;
    saving: boolean;
}

export const CategoryFormDialog = ({
    open,
    onOpenChange,
    initialData,
    parentCategories,
    onSubmit,
    saving,
}: CategoryFormDialogProps) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            parent_category: null,
            image_url: null,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    id: initialData.id,
                    name: initialData.name,
                    description: initialData.description || "",
                    parent_category: initialData.parent_category,
                    image_url: initialData.image_url,
                });
                setImagePreview(initialData.image_url || null);
            } else {
                reset({
                    name: "",
                    description: "",
                    parent_category: null,
                    image_url: null,
                });
                setImagePreview(null);
            }
        }
    }, [open, initialData, reset]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue("image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setValue("image", null);
        setValue("image_url", null);
        setImagePreview(null);
    };

    const onFormSubmit = async (data: CategoryFormValues) => {
        await onSubmit(data);
        if (!saving) {
            // Only close if submit didn't fail (handled by parent usually, but good practice here too if we want auto-close)
            // Actually, we'll let parent close it or we close it after success. 
            // For now, we rely on parent to update 'open' or reset form.
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Editar categoría" : "Añadir Categoría"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            placeholder="Nombre de la categoría"
                            disabled={saving}
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Descripción de la categoría"
                            disabled={saving}
                            rows={3}
                            {...register("description")}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Categoría Padre</Label>
                        <Select
                            value={watch("parent_category")?.toString() || "none"}
                            onValueChange={(value) =>
                                setValue(
                                    "parent_category",
                                    value === "none" ? null : Number(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Todas las categorías</SelectItem>
                                {parentCategories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label>Imagen</Label>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="image-upload"
                                disabled={saving}
                            />

                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-44 object-contain rounded-md border"
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
                                    onClick={() => document.getElementById("image-upload")?.click()}
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
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {initialData ? "Actualizando..." : "Guardando..."}
                                </>
                            ) : initialData ? (
                                "Actualizar"
                            ) : (
                                "Guardar"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
