import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, ArrowLeft, Plus, Trash2, CreditCard, Paperclip, Upload, X,
} from 'lucide-react';
import { useEditReturn } from '../hooks/useEditReturn';
import { formatCurrency } from '@/shared/utils/currency';
import { ReturnSelectionCambio } from '../components/returns/ReturnSelectionCambio';
import { ReturnSummary } from '../components/returns/ReturnSummary';
import { VoucherPreviewModal } from '@/modules/sales/components/sales/VoucherPreviewModal';

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
    shippingCost,
    setShippingCost,
    situationId,
    setSituationId,
    returnProducts,
    exchangeProducts,
    paymentMethods,
    payments,
    currentPayment,
    setCurrentPayment,
    addPayment,
    removePayment,
    voucherFileInputRef,
    handleVoucherSelect,
    removeVoucher,
    voucherModalOpen,
    setVoucherModalOpen,
    selectedVoucherPreview,
    setSelectedVoucherPreview,
    addReturnProduct,
    removeReturnProduct,
    updateReturnProductQuantity,
    addExchangeProduct,
    removeExchangeProduct,
    updateExchangeProduct,
    displayOrderId,
    orderTotal,
    calculateReturnTotal,
    calculateExchangeTotal,
    handleSave,
  } = useEditReturn();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/returns')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Devolución/Cambio</h1>
        <p className="text-muted-foreground mt-1">
          Modifica la información de la devolución o cambio
        </p>
      </div>

      <div className="grid gap-6">

        {/* Top row: payment (left, narrow) + info básica (right) */}
        <div className="grid grid-cols-[700px_1fr] gap-6 items-start">

          {/* ── Información Básica ────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayOrderId > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID Orden:</span>
                  <span className="font-medium text-foreground">#{displayOrderId}</span>
                </div>
              )}
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

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shippingReturn"
                    checked={shippingReturn}
                    onCheckedChange={setShippingReturn}
                  />
                  <Label htmlFor="shippingReturn">Envío a devolver</Label>
                </div>
                {shippingReturn && (
                  <div className="flex items-center gap-2">
                    <Label>Costo de envío:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Métodos de Pago ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pagos registrados */}
              {payments.filter((p) => p.paymentMethodId).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pagos Registrados</Label>
                  {payments.filter((p) => p.paymentMethodId).map((p) => {
                    const method = paymentMethods.find((pm) => pm.id.toString() === p.paymentMethodId);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{method?.name || 'Método'}</span>
                          <span className="text-sm font-medium">{formatCurrency(parseFloat(p.amount) || 0)}</span>
                          {p.voucherPreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => { setSelectedVoucherPreview(p.voucherPreview!); setVoucherModalOpen(true); }}
                              title="Ver comprobante"
                            >
                              <Paperclip className="w-3 h-3 text-primary" />
                            </Button>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removePayment(p.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Agregar nuevo pago */}
              <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                <Label className="text-sm font-medium">Método de Pago</Label>
                <Select
                  value={currentPayment.paymentMethodId}
                  onValueChange={(v) => setCurrentPayment((prev) => ({ ...prev, paymentMethodId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id.toString()}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={currentPayment.amount}
                  onChange={(e) => setCurrentPayment((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Monto"
                />
                {/* Voucher preview */}
                {currentPayment.voucherPreview && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <img src={currentPayment.voucherPreview} alt="Comprobante" className="h-10 w-10 object-cover rounded" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{currentPayment.voucherFile?.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeVoucher}>
                      <X className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  ref={voucherFileInputRef}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVoucherSelect(f); e.target.value = ""; }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={currentPayment.voucherPreview ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => voucherFileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {currentPayment.voucherPreview ? "Cambiar" : "Comprobante"}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" className="w-full" onClick={addPayment}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Productos a Devolver ─────────────────────────────────────── */}
        {(returnTypeCode === 'DVT' || returnTypeCode === 'DVP' || returnTypeCode === 'CAM') && (
          <Card>
            <CardHeader>
              <CardTitle>Productos a Devolver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {/* DVT: read-only, all products included */}
                {returnTypeCode === 'DVT' && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Variación</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.product_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{product.variation_name ?? ''}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(product.price)}</TableCell>
                            <TableCell>{formatCurrency(product.price * product.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* DVP / CAM: interactive picker */}
                {(returnTypeCode === 'DVP' || returnTypeCode === 'CAM') && (
                  <>
                    <div>
                      <Label>Productos de la Orden</Label>
                      <div className="border rounded-lg mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Variación</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderProducts.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.product_name ?? product.variations?.products?.title ?? ''}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{product.terms?.map(t => t.term_name).join(' / ') ?? ''}</TableCell>
                                <TableCell>{product.sku ?? product.variations?.sku ?? ''}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{formatCurrency(product.product_price)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" onClick={() => addReturnProduct(product)}>
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
                        <Label>Productos Seleccionados</Label>
                        <div className="border rounded-lg mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Variación</TableHead>
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
                                  <TableCell className="text-muted-foreground text-sm">{product.variation_name ?? ''}</TableCell>
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
                                    <Button variant="ghost" size="sm" onClick={() => removeReturnProduct(index)}>
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
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Productos de Cambio ──────────────────────────────────────── */}
        {returnTypeCode === 'CAM' && (
          <ReturnSelectionCambio
            exchangeProducts={exchangeProducts}
            returnProducts={returnProducts}
            onAddExchangeProduct={addExchangeProduct}
            onUpdateProduct={updateExchangeProduct}
            onRemoveProduct={removeExchangeProduct}
            formatCurrency={formatCurrency}
          />
        )}

        <ReturnSummary
          isCAM={returnTypeCode === 'CAM'}
          orderTotal={orderTotal}
          calculateReturnTotal={calculateReturnTotal}
          calculateExchangeTotal={calculateExchangeTotal}
          shippingReturn={shippingReturn}
          shippingCost={shippingCost}
          formatCurrency={formatCurrency}
        />

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
      <VoucherPreviewModal
        open={voucherModalOpen}
        onOpenChange={setVoucherModalOpen}
        voucherSrc={selectedVoucherPreview || ""}
      />
    </div>
  );
};

export default EditReturn;
