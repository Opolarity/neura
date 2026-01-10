import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useViewSale } from '../store/CreateSale.logic';

const ViewSale = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    formData,
    products,
    documentTypes,
    saleTypes,
    shippingMethods,
    countries,
    states,
    cities,
    neighborhoods,
    loading,
  } = useViewSale(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando información de la venta...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/sales/list')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ver Venta #{id}</h1>
          <p className="text-gray-600 mt-1">Información detallada de la venta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Datos del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Input
                    value={documentTypes.find(dt => dt.id === formData.documentType)?.name || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label>Número de Documento</Label>
                  <Input value={formData.documentNumber} disabled />
                </div>
                <div>
                  <Label>Nombres</Label>
                  <Input value={formData.customerName} disabled />
                </div>
                <div>
                  <Label>Apellidos</Label>
                  <Input value={formData.customerLastname} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} disabled />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={formData.phone} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirección de Envío */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Dirección de Envío</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>País</Label>
                  <Input
                    value={countries.find(c => c.id === formData.countryId)?.name || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={states.find(s => s.id === formData.stateId)?.name || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input
                    value={cities.find(c => c.id === formData.cityId)?.name || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label>Barrio</Label>
                  <Input
                    value={neighborhoods.find(n => n.id === formData.neighborhoodId)?.name || ''}
                    disabled
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Dirección</Label>
                  <Input value={formData.address} disabled />
                </div>
                <div className="md:col-span-2">
                  <Label>Referencia</Label>
                  <Textarea value={formData.addressReference} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Productos</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No hay productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>S/ {Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>S/ {Number(product.discount).toFixed(2)}</TableCell>
                        <TableCell>
                          S/ {((product.quantity * product.price) - product.discount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Venta */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Resumen de Venta</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Venta</Label>
                  <Input
                    value={saleTypes.find(st => st.id === formData.saleType)?.name || ''}
                    disabled
                  />
                </div>

                <div>
                  <Label>Método de Envío</Label>
                  <Input
                    value={shippingMethods.find(sm => sm.id === formData.shippingMethod)?.name || 'No especificado'}
                    disabled
                  />
                </div>

                <div>
                  <Label>Persona que Recibe</Label>
                  <Input value={formData.receptionPerson} disabled />
                </div>

                <div>
                  <Label>Teléfono de Recepción</Label>
                  <Input value={formData.receptionPhone} disabled />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>S/ {Number(formData.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Descuento:</span>
                    <span className="text-red-600">- S/ {Number(formData.discount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>S/ {Number(formData.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/sales/list')}
                  >
                    Volver al Listado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewSale;
