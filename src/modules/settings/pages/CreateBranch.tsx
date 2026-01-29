import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import useCreateBranch from '../hooks/useCreateBranch'

const CreateBranch = () => {
    const { id } = useParams();
    const branchId = id ? Number(id) : null;

    const {
        formData,
        loading,
        optionsLoading,
        warehouses,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSelectChange,
        handleSubmit,
        hasChanges,
    } = useCreateBranch(branchId, !!branchId)

    if (optionsLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p>Cargando...</p>
            </div>
        )
    }

    return (
        <div >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/settings/branches">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Crear Nueva Sucursal</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Sucursal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre de la sucursal *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ingrese el nombre de la sucursal"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Almacén *</Label>
                                <Select
                                    value={formData.warehouse?.toString() || ''}
                                    onValueChange={(value) => handleSelectChange('warehouse', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>País</Label>
                                    <Select
                                        value={formData.countries?.toString() || ''}
                                        onValueChange={(value) => handleSelectChange('countries', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar país" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ciudad</Label>
                                    <Select
                                        value={formData.states?.toString() || ''}
                                        onValueChange={(value) => handleSelectChange('states', value)}
                                        disabled={!formData.countries}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.map((state) => (
                                                <SelectItem key={state.id} value={state.id.toString()}>
                                                    {state.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Provincia</Label>
                                    <Select
                                        value={formData.cities?.toString() || ''}
                                        onValueChange={(value) => handleSelectChange('cities', value)}
                                        disabled={!formData.states}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar ciudad" />
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
                                <div className="grid gap-2">
                                    <Label>Distrito</Label>
                                    <Select
                                        value={formData.neighborhoods?.toString() || ''}
                                        onValueChange={(value) => handleSelectChange('neighborhoods', value)}
                                        disabled={!formData.cities}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Distrito" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {neighborhoods.map((neighborhood) => (
                                                <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                                                    {neighborhood.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Ingrese la dirección"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address_reference">Referencia de Dirección</Label>
                                <Input
                                    id="address_reference"
                                    value={formData.address_reference}
                                    onChange={handleChange}
                                    placeholder="Ingrese referencia de la dirección"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Link to="/settings/branches">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={loading || (!!branchId && !hasChanges)}>
                                    {loading ? (branchId ? 'Actualizando...' : 'Guardando...') : (branchId ? 'Actualizar' : 'Guardar Sucursal')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}

export default CreateBranch
