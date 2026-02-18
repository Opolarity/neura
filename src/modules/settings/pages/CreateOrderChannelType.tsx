import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import useCreateOrderChannelType from '../hooks/useCreateOrderChannelType';

const CreateOrderChannelType = () => {
    const {
        formData,
        loading,
        optionsLoading,
        paymentMethods,
        selectedPaymentMethods,
        handleChange,
        togglePaymentMethod,
        handleSubmit,
    } = useCreateOrderChannelType();

    if (optionsLoading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/settings/order-channel-types">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Crear Tipo de Canal de Pedido</h1>
                    <p className="text-muted-foreground mt-2">
                        Completa la información para crear un nuevo tipo de canal
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Métodos de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {paymentMethods.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No hay métodos de pago disponibles
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="flex items-center gap-2 py-1">
                                                <Checkbox
                                                    id={`pm-${method.id}`}
                                                    checked={selectedPaymentMethods.has(method.id)}
                                                    onCheckedChange={() => togglePaymentMethod(method.id)}
                                                />
                                                <Label
                                                    htmlFor={`pm-${method.id}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {method.name}
                                                    {method.business_accounts?.name && (
                                                        <span className="text-muted-foreground ml-1">
                                                            — {method.business_accounts.name}
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground mt-4">
                                    Selecciona los métodos de pago disponibles para este canal
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
                                    <p className="text-sm font-medium">Métodos de pago seleccionados:</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {selectedPaymentMethods.size}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-2">
                            <Button type="submit" className="w-full gap-2" disabled={loading}>
                                <Save className="w-4 h-4" />
                                {loading ? 'Creando...' : 'Crear Canal'}
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link to="/settings/order-channel-types">Cancelar</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateOrderChannelType;
