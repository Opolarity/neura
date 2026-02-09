import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Check
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";
import { formatCurrency } from "@/shared/utils/currency";

import { useCreateReturn } from "../hooks/useCreateReturn";
import { OrderSelectionDialog } from "../components/returns/OrderSelectionDialog";
import { ReturnProductsTable } from "../components/returns/ReturnProductsTable";
import { ExchangeProductsTable } from "../components/returns/ExchangeProductsTable";
import { ReturnSummary } from "../components/returns/ReturnSummary";

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
    paymentMethodId,
    setPaymentMethodId,
    returnProducts,
    exchangeProducts,
    searchQuery,
    setSearchQuery,
    selectedVariation,
    setSelectedVariation,
    open,
    setOpen,
    orderSearch,
    setOrderSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedOrders,
    filteredVariations,
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
        onOpenChange={setShowOrderModal}
        returnTypes={returnTypes}
        selectedReturnType={selectedReturnType}
        onReturnTypeChange={setSelectedReturnType}
        orderSearch={orderSearch}
        onOrderSearchChange={setOrderSearch}
        paginatedOrders={paginatedOrders}
        selectedOrderId={selectedOrder?.id}
        onOrderSelect={(order) => {
          // setSelectedOrder is handled inside handleOrderSelect or similarly
          // In the hook we have setSelectedOrder(order)
          // For now let's just use the toggle or setter
        }}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
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
                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id.toString()}>
                          {pm.name}
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
            <Card>
              <CardHeader>
                <CardTitle>Productos de Cambio (Salida)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={open} className="flex-1 justify-between">
                        {selectedVariation
                          ? `${selectedVariation.product_title} - ${selectedVariation.terms?.map((t: any) => t.terms.name).join(" ")}`
                          : "Buscar producto..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[600px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar por nombre o SKU..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron productos</CommandEmpty>
                          <CommandGroup>
                            {filteredVariations.slice(0, 20).map((variation) => (
                              <CommandItem
                                key={variation.id}
                                value={`${variation.product_title} ${variation.sku}`}
                                onSelect={() => setSelectedVariation(variation)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedVariation?.id === variation.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{variation.product_title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {variation.terms?.map((t: any) => t.terms.name).join(" - ")} - SKU: {variation.sku}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button type="button" onClick={addExchangeProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                <ExchangeProductsTable
                  exchangeProducts={exchangeProducts}
                  returnProducts={returnProducts}
                  onUpdateProduct={updateExchangeProduct}
                  onRemoveProduct={removeExchangeProduct}
                  formatCurrency={currencyFormatter}
                />

                <div className="mt-4 space-y-2 text-right border-t pt-4">
                  <p>Total Productos Devueltos: {formatCurrency(calculateReturnTotal())}</p>
                  <p>Total Productos Cambio: {formatCurrency(calculateExchangeTotal())}</p>
                  <p className="text-lg font-bold">
                    {calculateDifference() >= 0
                      ? `A Reembolsar: ${formatCurrency(calculateDifference())}`
                      : `Diferencia a Pagar: ${formatCurrency(Math.abs(calculateDifference()))}`}
                  </p>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </>
  );
};

export default CreateReturn;
