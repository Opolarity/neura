import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, Trash2, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/shared/utils/currency";

import { useCreateReturn } from "../hooks/useCreateReturn";
import { OrderSelectionDialog } from "../components/returns/OrderSelectionDialog";
import { ReturnProductsTable } from "../components/returns/ReturnProductsTable";
import { ReturnSummary } from "../components/returns/ReturnSummary";
import { ReturnSelectionCambio } from "../components/returns/ReturnSelectionCambio";

const CreateReturn = () => {
  const navigate = useNavigate();
  const {
    loading,
    saving,
    showOrderModal,
    setShowOrderModal,
    returnTypes,
    situations,
    documentTypes,
    paymentMethods,
    selectedOrder,
    selectedReturnType,
    setSelectedReturnType,
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
    payments,
    currentPayment,
    setCurrentPayment,
    addPayment,
    removePayment,
    returnProducts,
    exchangeProducts,
    orderSourceType,
    edgeSearch,
    edgePagination,
    edgeItems,
    edgeLoading,
    selectedEdgeItem,
    handleEdgeSourceChange,
    handleEdgeSearchChange,
    handleEdgePageChange,
    handleEdgePageSizeChange,
    handleEdgeItemSelect,
    handleOrderSelect,
    toggleReturnProduct,
    addExchangeProduct,
    removeExchangeProduct,
    updateExchangeProduct,
    calculateReturnTotal,
    calculateExchangeTotal,
    calculateDifference,
    handleSubmit
  } = useCreateReturn();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isDVT = returnTypeCode === "DVT";
  const isCAM = returnTypeCode === "CAM";

  const currencyFormatter = (amount: number) => formatCurrency(amount);

  return (
    <>
      <OrderSelectionDialog
        open={showOrderModal}
        onOpenChange={(open) => { setShowOrderModal(open); if (!open) navigate("/returns"); }}
        returnTypes={returnTypes}
        selectedReturnType={selectedReturnType}
        onReturnTypeChange={setSelectedReturnType}
        edgeItems={edgeItems}
        edgePagination={edgePagination}
        edgeLoading={edgeLoading}
        edgeSearch={edgeSearch}
        onEdgeSearchChange={handleEdgeSearchChange}
        selectedEdgeItemId={selectedEdgeItem?.id}
        onEdgeItemSelect={handleEdgeItemSelect}
        onEdgePageChange={handleEdgePageChange}
        onEdgePageSizeChange={handleEdgePageSizeChange}
        orderSourceType={orderSourceType}
        onOrderSourceTypeChange={handleEdgeSourceChange}
        onConfirm={handleOrderSelect}
        formatCurrency={currencyFormatter}
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Devolución/Cambio</h1>
              {returnTypeCode && (
                <Badge variant="outline" className="mt-1">
                  {returnTypes.find(t => t.code === returnTypeCode)?.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/returns")}>
              Cancelar
            </Button>
            <Button type="submit" form="return-form" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Devolución/Cambio
            </Button>
          </div>
        </div>

        <form id="return-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-[700px_1fr] gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>ID de Orden</Label>
                    <Input value={selectedOrder?.id || ""} disabled />
                  </div>
                  <div>
                    <Label>Situación *</Label>
                    <Select value={situationId} onValueChange={setSituationId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la situación" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={setDocumentType} required>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Número de Documento</Label>
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Razón de la Devolución/Cambio</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={shippingReturn}
                      onCheckedChange={setShippingReturn}
                      id="shipping-return"
                    />
                    <Label htmlFor="shipping-return">Devolver el envío</Label>
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

            <Card>
              <div className="col-span-2">
                {/* Pagos registrados */}
                {payments.filter((p) => p.paymentMethodId).length > 0 && (
                  <div className="space-y-2 mb-3">
                    <Label className="text-sm font-medium">Pagos Registrados</Label>
                    {payments.filter((p) => p.paymentMethodId).map((p) => {
                      const method = paymentMethods.find((pm) => pm.id.toString() === p.paymentMethodId);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{method?.name || "Método"}</span>
                            <span className="text-sm font-medium">{formatCurrency(parseFloat(p.amount) || 0)}</span>
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
                  <Label className="text-sm font-medium">Método de Pago *</Label>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="w-full" onClick={addPayment}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Productos a Devolver
                {isDVT && <span className="text-sm font-normal text-muted-foreground ml-2">(Devolución Total - Todos los productos)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnProductsTable
                orderProducts={orderProducts}
                returnProducts={returnProducts}
                onQuantityChange={toggleReturnProduct}
                isDVT={isDVT}
                formatCurrency={currencyFormatter}
              />
              <div className="mt-4 text-right">
                <p className="text-lg font-bold">
                  Total a Devolver: {formatCurrency(calculateReturnTotal())}
                </p>
              </div>
            </CardContent>
          </Card>

          {isCAM && (
            <ReturnSelectionCambio
              exchangeProducts={exchangeProducts}
              returnProducts={returnProducts}
              onAddExchangeProduct={addExchangeProduct}
              onUpdateProduct={updateExchangeProduct}
              onRemoveProduct={removeExchangeProduct}
              calculateReturnTotal={calculateReturnTotal}
              calculateExchangeTotal={calculateExchangeTotal}
              calculateDifference={calculateDifference}
              formatCurrency={currencyFormatter}
            />
          )}

          {!isCAM && (
            <ReturnSummary
              isCAM={isCAM}
              calculateReturnTotal={calculateReturnTotal}
              calculateExchangeTotal={calculateExchangeTotal}
              calculateDifference={calculateDifference}
              shippingReturn={shippingReturn}
              shippingCost={shippingCost}
              formatCurrency={currencyFormatter}
            />
          )}
        </form>
      </div >
    </>
  );
};

export default CreateReturn;
