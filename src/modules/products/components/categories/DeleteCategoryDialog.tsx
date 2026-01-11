import React from "react";
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
import { Loader2 } from "lucide-react";
import { Category } from "../../products.types";

interface DeleteCategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    categoryName: string;
    productCount: number;
    deleting: boolean;
}

const DeleteCategoryDialog = ({
    isOpen,
    onOpenChange,
    onConfirm,
    categoryName,
    productCount,
    deleting
}: DeleteCategoryDialogProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar categoría "{categoryName}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {productCount > 0 ? (
                            <>
                                Esta categoría cuenta con {productCount} producto(s) vinculado(s).
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
                        onClick={onConfirm}
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
    );
};

export default DeleteCategoryDialog;
