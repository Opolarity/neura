import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCreateSaleLogic } from './CreateSale.logic';

const CreateSale = () => {
  const {
    loading,
    saving,
    formData,
    products,
    salesData,
    selectedProduct,
    selectedVariation,
    paymentMethod,
    paymentAmount,
    confirmationCode,
    clientFound,
    searchingClient,
    handleInputChange,
    setSelectedProduct,
    setSelectedVariation,
    setPaymentMethod,
    setPaymentAmount,
    setConfirmationCode,
    searchClient,
    addProduct,
    removeProduct,
    updateProduct,
    calculateSubtotal,
    calculateDiscount,
    calculateTotal,
    handleSubmit,
    navigate,
  } = useCreateSaleLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const selectedProductData = salesData?.products.find((p) => p.id.toString() === selectedProduct);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Crear Venta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Tipo de Documento</Label>
              <Select value={formData.document_type} onValueChange={(v) => handleInputChange('document_type', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de Documento</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.document_number}
                  onChange={(e) => handleInputChange('document_number', e.target.value)}
                  onBlur={searchClient}
                  required
                  disabled={!formData.document_type}
                />
                {searchingClient && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
            </div>
            
            {clientFound !== null && (
              <>
                {clientFound ? (
                  <div className="md:col-span-2">
                    <Label>Nombre Completo</Label>
                    <Input
                      value={`${formData.customer_name} ${formData.customer_lastname}${formData.customer_lastname2 ? ' ' + formData.customer_lastname2 : ''}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Apellido Paterno</Label>
                      <Input
                        value={formData.customer_lastname}
                        onChange={(e) => handleInputChange('customer_lastname', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Apellido Materno</Label>
                      <Input
                        value={formData.customer_lastname2}
                        onChange={(e) => handleInputChange('customer_lastname2', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sale Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Venta</Label>
              <Select value={formData.sale_type} onValueChange={(v) => handleInputChange('sale_type', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.saleTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de Envío</Label>
              <Select value={formData.shipping_method} onValueChange={(v) => handleInputChange('shipping_method', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.shippingMethods.map((sm) => (
                    <SelectItem key={sm.id} value={sm.id.toString()}>
                      {sm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Dirección de Envío</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>País</Label>
              <Select value={formData.country_id} onValueChange={(v) => handleInputChange('country_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.countries.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado/Provincia</Label>
              <Select value={formData.state_id} onValueChange={(v) => handleInputChange('state_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.states
                    .filter((s) => !formData.country_id || s.country_id.toString() === formData.country_id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciudad</Label>
              <Select value={formData.city_id} onValueChange={(v) => handleInputChange('city_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.cities
                    .filter((c) => !formData.state_id || c.state_id.toString() === formData.state_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Barrio</Label>
              <Select value={formData.neighborhood_id} onValueChange={(v) => handleInputChange('neighborhood_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.neighborhoods
                    .filter((n) => !formData.city_id || n.city_id.toString() === formData.city_id)
                    .map((n) => (
                      <SelectItem key={n.id} value={n.id.toString()}>
                        {n.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Referencia</Label>
              <Input
                value={formData.address_reference}
                onChange={(e) => handleInputChange('address_reference', e.target.value)}
              />
            </div>
            <div>
              <Label>Persona que Recibe</Label>
              <Input
                value={formData.reception_person}
                onChange={(e) => handleInputChange('reception_person', e.target.value)}
              />
            </div>
            <div>
              <Label>Teléfono de Recepción</Label>
              <Input
                value={formData.reception_phone}
                onChange={(e) => handleInputChange('reception_phone', e.target.value)}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Producto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesData?.products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variación</Label>
                <Select
                  value={selectedVariation}
                  onValueChange={setSelectedVariation}
                  disabled={!selectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione variación" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProductData?.variations.map((v: any) => {
                      const termsNames = v.terms.map((t: any) => t.terms.name).join(' / ');
                      return (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {termsNames || v.sku}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addProduct} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {products.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-32">Precio</TableHead>
                    <TableHead className="w-32">Descuento</TableHead>
                    <TableHead className="w-32">Subtotal</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.variation_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={product.discount}
                          onChange={(e) => updateProduct(index, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </TableCell>
                      <TableCell>${(product.quantity * (product.price - product.discount)).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end space-y-2">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span className="font-semibold">-${calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Pago</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {salesData?.paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id.toString()}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={calculateTotal().toFixed(2)}
                step="0.01"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div>
              <Label>Código de Confirmación</Label>
              <Input value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/sales')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear Venta
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
