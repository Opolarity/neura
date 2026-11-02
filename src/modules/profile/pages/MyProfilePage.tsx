import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { PageLoader } from "@/shared/components/page-loader";
import useMyProfile from "../hooks/useMyProfile";

// Mismo formulario que editar usuario (settings/pages/CreateUser.tsx). El
// usuario cambia su celular, su ubicación y su contraseña; identidad, roles y
// sucursal se ven deshabilitados porque los asigna un administrador.
const MyProfilePage = () => {
  const {
    formData,
    requiredMarks,
    loading,
    optionsLoading,
    fetchingProfile,
    roles,
    warehouses,
    branches,
    documentTypes,
    countries,
    states,
    cities,
    neighborhoods,
    handleChange,
    handleSelectChange,
    handleSubmit,
    showPasswordField,
    togglePasswordField,
    isRUC,
  } = useMyProfile();

  if (fetchingProfile || optionsLoading) {
    return <PageLoader message="Cargando tu perfil..." />;
  }

  const roleNames = roles
    .filter((role) => formData.role_ids.includes(role.id))
    .map((role) => role.name)
    .join(", ");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Identificación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label required={requiredMarks.document_type_id}>Tipo de Documento</Label>
                    <Select value={formData.document_type_id} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document_number" required={requiredMarks.document_number}>
                      Número de Documento
                    </Label>
                    <Input id="document_number" value={formData.document_number} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" required={requiredMarks.name}>
                      {isRUC ? "Razón Social" : "Nombre"}
                    </Label>
                    <Input id="name" value={formData.name} disabled />
                  </div>

                  {/* Hide name fields if RUC */}
                  {!isRUC && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="middle_name">Segundo Nombre</Label>
                        <Input id="middle_name" value={formData.middle_name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" required={requiredMarks.last_name}>
                          Primer Apellido
                        </Label>
                        <Input id="last_name" value={formData.last_name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name2">Segundo Apellido</Label>
                        <Input id="last_name2" value={formData.last_name2} disabled />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_name" required={requiredMarks.user_name}>
                      Nombre de Usuario
                    </Label>
                    <Input id="user_name" value={formData.user_name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" required={requiredMarks.email}>Email</Label>
                    <Input id="email" type="email" value={formData.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña (opcional al actualizar)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={!showPasswordField}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={togglePasswordField}>
                        {showPasswordField ? "Cancelar" : "Cambiar"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" required={requiredMarks.phone}>Celular</Label>
                    {/* Sin `required` nativo, igual que al editar un usuario:
                        el celular se marca pero no bloquea a los usuarios
                        antiguos que no tienen teléfono. */}
                    <Input
                      id="phone"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="987654321"
                      value={formData.phone}
                      onChange={handleChange}
                      aria-required={requiredMarks.phone}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="roles" required={requiredMarks.role_ids}>Roles</Label>
                  <Input id="roles" value={roleNames || "Sin roles"} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Select
                      value={formData.country_id}
                      onValueChange={(val) =>
                        handleSelectChange("country_id", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select
                      value={formData.state_id}
                      onValueChange={(val) =>
                        handleSelectChange("state_id", val)
                      }
                      disabled={!formData.country_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem
                            key={state.id}
                            value={state.id.toString()}
                          >
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Select
                      value={formData.city_id}
                      onValueChange={(val) =>
                        handleSelectChange("city_id", val)
                      }
                      disabled={!formData.state_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Distrito</Label>
                    <Select
                      value={formData.neighborhood_id}
                      onValueChange={(val) =>
                        handleSelectChange("neighborhood_id", val)
                      }
                      disabled={!formData.city_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar distrito" />
                      </SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map((neighborhood) => (
                          <SelectItem
                            key={neighborhood.id}
                            value={neighborhood.id.toString()}
                          >
                            {neighborhood.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Dirección completa"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address_reference">
                      Referencia de Dirección
                    </Label>
                    <Input
                      id="address_reference"
                      placeholder="Referencia (ej: cerca al parque)"
                      value={formData.address_reference}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Assignment (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label required={requiredMarks.branches_id}>Sucursal</Label>
                  <Select value={formData.branches_id} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id.toString()}
                        >
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label required={requiredMarks.warehouse_id}>Almacén</Label>
                  <Select value={formData.warehouse_id} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={warehouse.id.toString()}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MyProfilePage;
