import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ComponentPermission } from '@/shared/components/component-permission'

export default function RolesHeader() {
    return (
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Listado de Roles</h1>
                <p className="text-muted-foreground">
                    Administra los roles del sistema y sus funciones asignadas
                </p>
            </div>

            {/* El botón lleva a /settings/roles/create, ya protegida con
                roles.create: se reutiliza ese code para no ofrecer un botón que
                acaba en una pantalla bloqueada. */}
            <ComponentPermission codeIn={["roles.create"]}>
                <Button asChild className="gap-2">
                    <Link to="/settings/roles/create">
                        <Plus className="w-4 h-4" />
                        Nuevo Rol
                    </Link>
                </Button>
            </ComponentPermission>
        </div>
    )
}
