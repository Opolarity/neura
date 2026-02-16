import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useCreateOrderChannelType from '../hooks/useCreateOrderChannelType';

const CreateOrderChannelType = () => {
    const {
        formData,
        loading,
        optionsLoading,
        modules,
        handleChange,
        handleSelectChange,
        handleSubmit,
    } = useCreateOrderChannelType();

    if (optionsLoading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/settings/order-channel-types">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Crear Tipo de Canal de Pedido</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej: Web"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Código</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Ej: WEB"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link to="/settings/order-channel-types">
                                <Button variant="outline" type="button" disabled={loading}>
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creando...' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateOrderChannelType;
