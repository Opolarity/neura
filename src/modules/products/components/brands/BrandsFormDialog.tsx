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
import type { CreateBrandPayload, EditBrandPayload } from "@/modules/products/types/Brands.types";
import { useBrandsForm } from "@/modules/products/hooks/useBrandsForm";

interface BrandsFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateBrand: (payload: CreateBrandPayload) => Promise<void>;
    onEditBrand?: (payload: EditBrandPayload) => Promise<void>;
    editBrand?: EditBrandPayload;
}

export const BrandsFormDialog = ({ open, onOpenChange, onCreateBrand, onEditBrand, editBrand }: BrandsFormDialogProps) => {
    const { form, errors, isEditing, handleChange, handleSubmit } = useBrandsForm({
        open,
        editBrand,
        onCreateBrand,
        onEditBrand,
        onSuccess: () => onOpenChange(false),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Marca" : "Crear Marca"}</DialogTitle>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ej. Nike"
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
                                placeholder="Ej. brand-nike"
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
