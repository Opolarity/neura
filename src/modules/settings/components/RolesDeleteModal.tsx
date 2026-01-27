import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface RolesDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    deleting: boolean;
    handleDeleteConfirm: () => void;
}

export default function RolesDeleteModal({
    isOpen,
    onClose,
    deleting,
    handleDeleteConfirm,
}: RolesDeleteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Eliminar Rol</DialogTitle>
                </DialogHeader>

                <DialogDescription>Esta acción no se puede deshacer. Se eliminará el rol y todos sus registros relacionados.</DialogDescription>

                <DialogFooter className="flex gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            'Eliminar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        // <AlertDialog open={isOpen} onOpenChange={setDeleteDialogOpen}>
        //     <AlertDialogContent>
        //         <AlertDialogHeader>
        //             <AlertDialogTitle>
        //                 ¿Eliminar producto?
        //             </AlertDialogTitle>
        //             <AlertDialogDescription>
        //                 Esta acción no se puede deshacer. Se eliminará el rol y todos sus registros relacionados.
        //             </AlertDialogDescription>
        //         </AlertDialogHeader>
        //         <AlertDialogFooter>
        //             <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
        //             <AlertDialogAction
        //                 onClick={handleDeleteConfirm}
        //                 disabled={deleting}
        //                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        //             >
        //                 {deleting ? (
        //                     <>
        //                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        //                         Eliminando...
        //                     </>
        //                 ) : (
        //                     'Eliminar'
        //                 )}
        //             </AlertDialogAction>
        //         </AlertDialogFooter>
        //     </AlertDialogContent>
        // </AlertDialog>
    )
}

