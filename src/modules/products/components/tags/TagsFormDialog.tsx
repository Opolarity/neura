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
import type { CreateTagPayload, EditTagPayload } from "@/modules/products/types/Tags.types";
import { useTagsForm } from "@/modules/products/hooks/useTagsForm";

interface TagsFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTag: (payload: CreateTagPayload) => Promise<void>;
    onEditTag?: (payload: EditTagPayload) => Promise<void>;
    editTag?: EditTagPayload;
}

export const TagsFormDialog = ({ open, onOpenChange, onCreateTag, onEditTag, editTag }: TagsFormDialogProps) => {
    const { form, errors, isEditing, handleChange, handleSubmit } = useTagsForm({
        open,
        editTag,
        onCreateTag,
        onEditTag,
        onSuccess: () => onOpenChange(false),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Etiqueta" : "Crear Etiqueta"}</DialogTitle>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ej. Oferta Verano"
                            value={form.name}
                            onChange={handleChange}
                        />
                        {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                    </div>

                    {!isEditing && (
                        <div className="space-y-1">
                            <Label htmlFor="code">Código</Label>
                            <Input
                                id="code"
                                placeholder="Ej. oferta-verano"
                                value={form.code}
                                onChange={handleChange}
                            />
                            {errors.code && <span className="text-xs text-destructive">{errors.code}</span>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
