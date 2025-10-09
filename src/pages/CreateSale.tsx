import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCreateSale } from '@/hooks/useCreateSale';
import { CustomerInfoSection } from '@/components/sales/CustomerInfoSection';
import { SaleInfoSection } from '@/components/sales/SaleInfoSection';
import { ShippingAddressSection } from '@/components/sales/ShippingAddressSection';
import { ProductsSection } from '@/components/sales/ProductsSection';
import { PaymentSection } from '@/components/sales/PaymentSection';

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
    handleInputChange,
    addProduct,
    removeProduct,
    updateProduct,
    calculateSubtotal,
    calculateDiscount,
    calculateTotal,
    handleSubmit,
    setSelectedProduct,
    setSelectedVariation,
    setPaymentMethod,
    setPaymentAmount,
    setConfirmationCode,
    navigate,
  } = useCreateSale();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Crear Venta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <CustomerInfoSection
          formData={formData}
          salesData={salesData}
          onInputChange={handleInputChange}
        />

        <SaleInfoSection
          formData={formData}
          salesData={salesData}
          onInputChange={handleInputChange}
        />

        <ShippingAddressSection
          formData={formData}
          salesData={salesData}
          onInputChange={handleInputChange}
        />

        <ProductsSection
          products={products}
          salesData={salesData}
          selectedProduct={selectedProduct}
          selectedVariation={selectedVariation}
          onProductChange={setSelectedProduct}
          onVariationChange={setSelectedVariation}
          onAddProduct={addProduct}
          onRemoveProduct={removeProduct}
          onUpdateProduct={updateProduct}
        />

        <PaymentSection
          salesData={salesData}
          paymentMethod={paymentMethod}
          paymentAmount={paymentAmount}
          confirmationCode={confirmationCode}
          total={calculateTotal()}
          onPaymentMethodChange={setPaymentMethod}
          onPaymentAmountChange={setPaymentAmount}
          onConfirmationCodeChange={setConfirmationCode}
        />

        <div className="flex justify-between items-center p-6 bg-muted rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Descuento:</span>
              <span className="font-medium text-destructive">-${calculateDiscount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8 text-xl font-bold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          <Button type="submit" disabled={saving || products.length === 0} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Crear Venta'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
