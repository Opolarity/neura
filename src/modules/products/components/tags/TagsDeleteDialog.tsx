import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TagsDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tagName?: string;
    onDelete: () => void;
}

export const TagsDeleteDialog = ({ open, onOpenChange, tagName = "Productopra", onDelete }: TagsDeleteDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar tag?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Esta acción no se puede deshacer. Se eliminará el tag{" "}
                    <span className="font-semibold text-foreground">"{tagName}"</span> de forma permanente.
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
