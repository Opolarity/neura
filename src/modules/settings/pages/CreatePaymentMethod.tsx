import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import useCreatePaymentMethod from '../hooks/useCreatePaymentMethod';

const CreatePaymentMethod = () => {
    const { id } = useParams();
    const paymentMethodId = id ? Number(id) : null;
    const isEdit = !!paymentMethodId;

    const {
        formData,
        loading,
        optionsLoading,
        businessAccounts,
        handleChange,
        handleSelectChange,
        handleActiveChange,
        handleSubmit,
    } = useCreatePaymentMethod(paymentMethodId, isEdit);

    if (optionsLoading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/settings/payment-methods">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">
                    {isEdit ? 'Editar Método de Pago' : 'Crear Método de Pago'}
                </h1>
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
                                placeholder="Ej: Tarjeta de Crédito"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="business_account_id">Cuenta de Negocio</Label>
                            <Select
                                value={formData.business_account_id?.toString()}
                                onValueChange={handleSelectChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cuenta de negocio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {businessAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label>Estado</Label>
                                <div className="text-sm text-muted-foreground">
                                    {formData.active ? 'Activo' : 'Inactivo'}
                                </div>
                            </div>
                            <Switch
                                checked={formData.active}
                                onCheckedChange={handleActiveChange}
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link to="/settings/payment-methods">
                                <Button variant="outline" type="button" disabled={loading}>
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreatePaymentMethod;
