import { Button } from '@/components/ui/button'
import { Edit, Loader2, Save } from 'lucide-react'
import { ComponentPermission } from '@/shared/components/component-permission'

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
            {/* Un solo envoltorio para los tres botones: son el mismo flujo de
                edición, y Cancelar/Actualizar ni siquiera existen hasta entrar
                en modo edición. Sin el code no se puede entrar, y los inputs de
                stock de la tabla ya están deshabilitados fuera de ese modo. */}
            <ComponentPermission codeIn={['inventory.edit']}>
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
            </ComponentPermission>
        </div>
    )
}

export default InventoryHeader
