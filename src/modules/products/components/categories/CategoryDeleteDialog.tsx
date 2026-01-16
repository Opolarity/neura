import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Category } from "../../types/Categories.types";

interface CategoryDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: Category | null;
    childCount: number;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const CategoryDeleteDialog = ({
    open,
    onOpenChange,
    category,
    childCount,
    onConfirm,
    isDeleting,
}: CategoryDeleteDialogProps) => {
    if (!category) return null;

    const isParent = childCount > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>¿Eliminar categoría?</DialogTitle>

                    {isParent ? (
                        <div className="flex flex-col gap-2 text-left text-sm text-muted-foreground pt-4">
                            <p>No se puede eliminar esta categoría inmediatamente:</p>

                            <p>
                                Tiene <strong>{childCount}</strong> subcategoría(s) vinculada(s).
                            </p>

                            <p className="text-destructive font-medium pt-2">
                                ¿Aún así deseas borrarla? Se eliminarán los vínculos y las
                                subcategorías podrían quedar huérfanas.
                            </p>
                        </div>
                    ) : (
                        <DialogDescription className="pt-4">
                            Esta acción no se puede deshacer. Se eliminará la categoría de
                            forma permanente.
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            "Eliminar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
