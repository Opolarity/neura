import { Button } from '@/components/ui/button'
import { Edit, Loader2, Save } from 'lucide-react'

interface InventoryHeaderProps {
    isEditing: boolean
    handleEdit: () => void
    handleCancel: () => void
    handleSave: () => void
    hasChanges: boolean
    isSaving: boolean
}

const InventoryHeader = ({ isEditing, handleEdit, handleCancel, handleSave, hasChanges, isSaving }: InventoryHeaderProps) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    Inventario por Almacén
                </h1>
                <p className="text-muted-foreground">
                    Gestiona el stock de todas las variaciones
                </p>
            </div>
            <div className="flex gap-2">
                {!isEditing ? (
                    <Button onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" onClick={handleCancel}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Actualizar
                                </>
                            )}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export default InventoryHeader