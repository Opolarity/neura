import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useCreateWarehouse from '../hooks/useCreateWarehouse'

const CreateWarehouses = () => {
    const {
        formData,
        loading,
        optionsLoading,
        countries,
        states,
        cities,
        neighborhoods,
        handleChange,
        handleSelectChange,
        handleSubmit,
    } = useCreateWarehouse()

    if (optionsLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p>Cargando...</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Crear Almacén</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre del almacén *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ingrese el nombre del almacén"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>País *</Label>
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
                                <Label>Estado</Label>
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
                                <Label>Ciudad</Label>
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
                                        <SelectValue placeholder="Seleccionar barrio" />
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

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Almacén'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

export default CreateWarehouses