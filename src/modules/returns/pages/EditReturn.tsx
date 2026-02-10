import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Plus, Search, ChevronLeft, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react';
import { useEditReturn } from '../hooks/useEditReturn';
import { formatCurrency } from '@/shared/utils/currency';

const EditReturn = () => {
  const navigate = useNavigate();
  const {
    loading,
    saving,
    situations,
    documentTypes,
    returnTypes,
    selectedReturnType,
    returnTypeCode,
    orderProducts,
    reason,
    setReason,
    documentType,
    setDocumentType,
    documentNumber,
    setDocumentNumber,
    shippingReturn,
    setShippingReturn,
    situationId,
    setSituationId,
    returnProducts,
    newProducts,
    searchQuery,
    setSearchQuery,
    searchProducts,
    searchLoading,
    searchPagination,
    handleSearchPageChange,
    addReturnProduct,
    removeReturnProduct,
    updateReturnProductQuantity,
    addProductFromSearch,
    removeNewProduct,
    updateNewProductQuantity,
    updateNewProductDiscount,
    calculateTotals,
    handleSave
  } = useEditReturn();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/returns')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Devolución/Cambio</h1>
        <p className="text-muted-foreground mt-1">
          Modifica la información de la devolución o cambio
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType">
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

              <div>
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="returnType">Tipo de Devolución/Cambio</Label>
              <Select value={selectedReturnType} disabled>
                <SelectTrigger id="returnType" className="bg-muted">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {returnTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa el motivo de la devolución/cambio"
              />
            </div>

            <div>
              <Label htmlFor="situation">Situación *</Label>
              <Select value={situationId} onValueChange={setSituationId}>
                <SelectTrigger id="situation">
                  <SelectValue placeholder="Seleccionar situación" />
                </SelectTrigger>
                <SelectContent>
                  {situations.map((situation) => (
                    <SelectItem key={situation.id} value={situation.id.toString()}>
                      {situation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="shippingReturn"
                checked={shippingReturn}
                onCheckedChange={setShippingReturn}
              />
              <Label htmlFor="shippingReturn">Envío a devolver</Label>
            </div>
          </CardContent>
        </Card>

        {(returnTypeCode === 'DVP' || returnTypeCode === 'CAM') && (
          <Card>
            <CardHeader>
              <CardTitle>Productos a Devolver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Productos de la Orden</Label>
                  <div className="border rounded-lg mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.variations.products.title}</TableCell>
                            <TableCell>{product.variations.sku}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(product.product_price)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addReturnProduct(product)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {returnProducts.length > 0 && (
                  <div>
                    <Label>Productos a Devolver</Label>
                    <div className="border rounded-lg mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio Unitario</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnProducts.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>{product.product_name}</TableCell>
                              <TableCell>{product.sku}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => updateReturnProductQuantity(index, Number(e.target.value))}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>{formatCurrency(product.price)}</TableCell>
                              <TableCell>{formatCurrency(product.price * product.quantity)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeReturnProduct(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {returnTypeCode === 'CAM' && (
          <Card>
            <CardHeader>
              <CardTitle>Productos de Cambio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre o SKU..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchQuery && searchProducts.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableBody>
                      {searchProducts.map((product) => (
                        <TableRow key={product.variationId}>
                          <TableCell className="w-12">
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt={product.productTitle} className="w-10 h-10 object-cover rounded" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.productTitle}</div>
                            <div className="text-xs text-muted-foreground">{product.sku}</div>
                          </TableCell>
                          <TableCell>{product.terms.map(t => t.name).join(' / ')}</TableCell>
                          <TableCell>{formatCurrency(product.prices?.[0]?.sale_price || product.prices?.[0]?.price || 0)}</TableCell>
                          <TableCell>Stock: {product.stock}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => addProductFromSearch(product)}>
                              <Plus className="w-4 h-4 mr-1" /> Agregar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between p-2 border-t bg-muted/50">
                    <span className="text-xs text-muted-foreground">
                      Total: {searchPagination.total} productos
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={searchPagination.page === 1}
                        onClick={() => handleSearchPageChange(searchPagination.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs">
                        Página {searchPagination.page} de {Math.ceil(searchPagination.total / searchPagination.size)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={searchPagination.page >= Math.ceil(searchPagination.total / searchPagination.size)}
                        onClick={() => handleSearchPageChange(searchPagination.page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : searchQuery && !searchLoading && (
                <p className="text-center py-4 text-sm text-muted-foreground">No se encontraron productos</p>
              )}

              {newProducts.length > 0 && (
                <div className="border rounded-lg mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Desc.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-xs text-muted-foreground">{product.variation_name}</div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateNewProductQuantity(index, Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={product.discount}
                              onChange={(e) => updateNewProductDiscount(index, Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency((product.price - product.discount) * product.quantity)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNewProduct(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>Total Devolución:</span>
              <span className="font-medium text-destructive">{formatCurrency(totals.returnTotal)}</span>
            </div>
            {returnTypeCode === 'CAM' && (
              <div className="flex justify-between py-2 border-b">
                <span>Total Productos Cambio:</span>
                <span className="font-medium text-green-600">{formatCurrency(totals.newTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-lg font-bold">
              <span>
                {totals.difference === 0 ? 'Diferencia:' :
                  totals.difference > 0 ? 'Diferencia a Pagar:' : 'A Reembolsar:'}
              </span>
              <span className={totals.difference > 0 ? 'text-green-600' : totals.difference < 0 ? 'text-destructive' : ''}>
                {formatCurrency(Math.abs(totals.difference))}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => navigate('/returns')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditReturn;
