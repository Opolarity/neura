import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BrandsDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandName?: string;
    onDelete: () => void;
}

export const BrandsDeleteDialog = ({ open, onOpenChange, brandName = "Marca", onDelete }: BrandsDeleteDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar marca?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Esta acción no se puede deshacer. Se eliminará la marca{" "}
                    <span className="font-semibold text-foreground">"{brandName}"</span> de forma permanente.
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={onDelete}>
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
