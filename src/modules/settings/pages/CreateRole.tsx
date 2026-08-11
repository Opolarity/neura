import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import useCreateRole from "../hooks/useCreateRole";
import PermissionTreeSelector from "../components/roles/PermissionTreeSelector";

const CreateRole = () => {
  const { id } = useParams();
  const roleId = id ? parseInt(id, 10) : undefined;

  const {
    isEdit,
    formData,
    loading,
    saving,
    permissionNodes,
    permissionSearch,
    setPermissionSearch,
    handleNameChange,
    handleToggleAdmin,
    togglePermission,
    handleSubmit,
  } = useCreateRole(roleId);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings/roles">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Editar Rol" : "Crear Rol"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEdit
              ? "Modifica la información del rol y los permisos que tiene asignados"
              : "Completa la información para crear un nuevo rol"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Rol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Rol *</Label>
                  <Input
                    id="name"
                    placeholder="Ingresa el nombre del rol"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin"
                    checked={formData.admin}
                    onCheckedChange={(checked) =>
                      handleToggleAdmin(checked as boolean)
                    }
                  />
                  <Label htmlFor="admin">Rol de Administrador</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Un rol administrador recibe automáticamente todos los permisos
                  del sistema, incluidos los que se agreguen más adelante.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionTreeSelector
                  nodes={permissionNodes}
                  selectedIds={formData.permissions}
                  onToggle={togglePermission}
                  disabled={formData.admin}
                  emptyMessage="Aún no hay permisos configurados en el sistema."
                  search={permissionSearch}
                  onSearchChange={setPermissionSearch}
                  searchPlaceholder="Buscar permiso..."
                />
                <p className="text-sm text-muted-foreground mt-4">
                  Vistas y rutas del sistema a las que este rol tendrá acceso.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Permisos seleccionados:</p>
                  <p className="text-2xl font-bold">
                    {formData.permissions.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo de rol:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.admin ? "Administrador" : "Regular"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full gap-2" disabled={saving}>
                <Save className="w-4 h-4" />
                {saving
                  ? "Guardando..."
                  : isEdit
                    ? "Actualizar Rol"
                    : "Crear Rol"}
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/settings/roles">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRole;
