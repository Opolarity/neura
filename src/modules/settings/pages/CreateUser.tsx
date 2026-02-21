import React from "react";
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
import { ArrowLeft, Save, ChevronDown, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import useCreateUser from "../hooks/useCreateUser";

const CreateUser = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const {
    formData,
    loading,
    optionsLoading,
    fetchingUser,
    roles,
    warehouses,
    branches,
    documentTypes,
    accountTypes,
    countries,
    states,
    cities,
    neighborhoods,
    handleChange,
    handleSelectChange,
    handleBranchChange,
    toggleRole,
    toggleAccountType,
    handleSubmit,
    showPasswordField,
    setShowPasswordField,
    isRUC,
    isSearchingDocument,
    isDocumentFound,
    handleDocumentLookup,
  } = useCreateUser(id, isEdit);

  if (fetchingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Cargando datos del usuario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/settings/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </h1>
        </div>
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
                    <Label>Tipo de Documento</Label>
                    <Select
                      value={formData.document_type_id}
                      onValueChange={(val) => {
                        handleSelectChange("document_type_id", val);
                        if (formData.document_number) handleDocumentLookup(val);
                      }}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
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
                    <Label htmlFor="document_number">Número de Documento</Label>
                    <div className="relative">
                      <Input
                        id="document_number"
                        placeholder="Ingrese el número"
                        value={formData.document_number}
                        onChange={handleChange}
                        onBlur={() => handleDocumentLookup()}
                        disabled={isEdit || !formData.document_type_id}
                        className={isSearchingDocument ? "pr-10" : ""}
                      />
                      {isSearchingDocument && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
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
                    <Label htmlFor="name">
                      {isRUC ? "Razón Social *" : "Nombre *"}
                    </Label>
                    <Input
                      id="name"
                      placeholder={
                        isRUC ? "Nombre de la empresa" : "Primer nombre"
                      }
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isEdit || isDocumentFound}
                    />
                  </div>

                  {/* Hide name fields if RUC */}
                  {!isRUC && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="middle_name">Segundo Nombre</Label>
                        <Input
                          id="middle_name"
                          placeholder="Segundo nombre"
                          value={formData.middle_name}
                          onChange={handleChange}
                          disabled={isEdit || isDocumentFound}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Primer Apellido *</Label>
                        <Input
                          id="last_name"
                          placeholder="Primer apellido"
                          value={formData.last_name}
                          onChange={handleChange}
                          required
                          disabled={isEdit || isDocumentFound}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name2">Segundo Apellido</Label>
                        <Input
                          id="last_name2"
                          placeholder="Segundo apellido"
                          value={formData.last_name2}
                          onChange={handleChange}
                          disabled={isEdit || isDocumentFound}
                        />
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Contraseña {isEdit ? "(opcional al actualizar)" : "*"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={formData.password}
                        onChange={handleChange}
                        required={!isEdit}
                        disabled={isEdit && !showPasswordField}
                        className="flex-1"
                      />
                      {isEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setShowPasswordField(!showPasswordField)
                          }
                        >
                          {showPasswordField ? "Cancelar" : "Cambiar"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="Número de teléfono"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Roles Multi-select */}
                <div className="space-y-2 pt-2">
                  <Label>Roles </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {formData.role_ids.length > 0
                          ? `${formData.role_ids.length} seleccionado${formData.role_ids.length > 1 ? "s" : ""}`
                          : "Seleccionar roles"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandEmpty>No se encontraron roles.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {roles.map((role) => (
                            <CommandItem
                              key={role.id}
                              onSelect={() => toggleRole(role.id)}
                              className="cursor-pointer"
                            >
                              <Checkbox
                                checked={formData.role_ids.includes(role.id)}
                                className="mr-2"
                              />
                              {role.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {formData.role_ids.length === 0}
                </div>

                {/* Account Types Multi-select */}
                <div className="space-y-2 pt-2">
                  <Label>Tipos de Cuenta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {formData.type_ids.length > 0
                          ? `${formData.type_ids.length} seleccionado${formData.type_ids.length > 1 ? "s" : ""}`
                          : "Seleccionar tipos de cuenta"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandEmpty>No se encontraron tipos.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {accountTypes.map((type) => {
                            const isUseType = type.name
                              ?.toUpperCase()
                              .includes("USE");
                            return (
                              <CommandItem
                                key={type.id}
                                onSelect={() => toggleAccountType(type.id)}
                                className={`cursor-pointer ${isUseType ? "opacity-50" : ""}`}
                                disabled={
                                  isUseType &&
                                  formData.type_ids.includes(type.id)
                                }
                              >
                                <Checkbox
                                  checked={formData.type_ids.includes(type.id)}
                                  className="mr-2"
                                  disabled={
                                    isUseType &&
                                    formData.type_ids.includes(type.id)
                                  }
                                />
                                {type.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <Label>Sucursal *</Label>
                  <Select
                    value={formData.branches_id}
                    onValueChange={handleBranchChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
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
                  <Label>Almacén *</Label>
                  <Select
                    value={formData.warehouse_id}
                    onValueChange={(val) =>
                      handleSelectChange("warehouse_id", val)
                    }
                    disabled={true}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar almacén" />
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

            {/* Actions - Below both columns */}
            <div className="flex justify-end gap-4 mt-6">
              <Link to="/settings/users">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Actualizar" : "Crear"} Usuario
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

export default CreateUser;
