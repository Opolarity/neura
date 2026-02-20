import { Loader2 } from "lucide-react";
import { usePOS } from "../hooks/usePOS";
import POSHeader from "../components/pos/POSHeader";
import POSStepIndicator from "../components/pos/POSStepIndicator";
import POSWizardNavigation from "../components/pos/POSWizardNavigation";
import POSSummary from "../components/pos/POSSummary";
import POSSessionModal from "../components/pos/POSSessionModal";
import POSCloseSessionModal from "../components/pos/POSCloseSessionModal";
import ConfigurationStep from "../components/pos/steps/ConfigurationStep";
import ProductsStep from "../components/pos/steps/ProductsStep";
import CustomerDataStep from "../components/pos/steps/CustomerDataStep";
import ShippingStep from "../components/pos/steps/ShippingStep";
import PaymentStep from "../components/pos/steps/PaymentStep";
import type { POSStep } from "../types/POS.types";

export default function POS() {
  const pos = usePOS();

  // Loading state
  if (pos.loading || pos.sessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  // No active session - show open session modal
  if (!pos.hasActiveSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <POSSessionModal
          isOpen={true}
          isOpening={pos.openingSession}
          onOpen={pos.openSession}
        />
      </div>
    );
  }

  // Determine if we can proceed to next step
  const canProceedNext = pos.canProceedToStep((pos.currentStep + 1) as POSStep);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <POSHeader session={pos.session} onExit={pos.exitPOS} />

      {/* Step indicator */}
      <div className="bg-white border-b py-6">
        <POSStepIndicator
          currentStep={pos.currentStep}
          requiresShipping={pos.customer.requiresShipping}
          onStepClick={pos.goToStep}
          canProceedToStep={pos.canProceedToStep}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="flex items-start">
          {/* Step content */}
          <div className="flex-1 p-6 overflow-auto">
            {pos.currentStep === 1 && (
              <ConfigurationStep
                priceLists={pos.priceLists}
                userWarehouseName={pos.userWarehouseName}
                onConfirm={pos.confirmConfiguration}
                onReset={pos.resetAll}
              />
            )}

            {pos.currentStep === 2 && (
              <ProductsStep
                searchQuery={pos.searchQuery}
                onSearchChange={pos.setSearchQuery}
                products={pos.paginatedProducts}
                productsLoading={pos.productsLoading}
                cart={pos.cart}
                onAddToCart={pos.addToCart}
                onUpdateQuantity={pos.updateCartItem}
                onRemoveFromCart={pos.removeFromCart}
                pagination={pos.productPagination}
                onPageChange={pos.handleProductPageChange}
                priceListId={pos.configuration?.priceListId || ""}
                total={pos.total}
              />
            )}

            {pos.currentStep === 3 && pos.formData && (
              <CustomerDataStep
                customer={pos.customer}
                documentTypes={pos.formData.documentTypes}
                clientFound={pos.clientFound}
                searchingClient={pos.searchingClient}
                onUpdateCustomer={pos.updateCustomer}
                onSearchClient={pos.searchClient}
              />
            )}

            {pos.currentStep === 4 && pos.formData && (
              <ShippingStep
                shipping={pos.shipping}
                countries={pos.formData.countries}
                states={pos.formData.states}
                cities={pos.formData.cities}
                neighborhoods={pos.formData.neighborhoods}
                shippingCosts={pos.availableShippingCosts}
                onUpdateShipping={pos.updateShipping}
              />
            )}

            {pos.currentStep === 5 && pos.formData && (
              <PaymentStep
                customer={pos.customer}
                cart={pos.cart}
                payments={pos.payments}
                currentPayment={pos.currentPayment}
                paymentMethods={pos.filteredPaymentMethods}
                subtotal={pos.subtotal}
                discountAmount={pos.discountAmount}
                shippingCost={pos.customer.requiresShipping ? pos.shipping.shippingCost : 0}
                total={pos.total}
                totalPaid={pos.totalPaid}
                changeAmount={pos.changeAmount}
                onUpdateCurrentPayment={pos.updateCurrentPayment}
                onAddPayment={pos.addPayment}
                onRemovePayment={pos.removePayment}
              />
            )}
          </div>

          {/* Summary sidebar - visible from step 3 */}
          {pos.currentStep >= 3 && pos.currentStep < 5 && (
            <div className="p-6 pl-0">
              <POSSummary
                cart={pos.cart}
                customer={pos.customer}
                subtotal={pos.subtotal}
                discountAmount={pos.discountAmount}
                shippingCost={pos.customer.requiresShipping ? pos.shipping.shippingCost : 0}
                total={pos.total}
                showProducts={pos.currentStep >= 3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer - hidden on step 1 since ConfigurationStep has its own button */}
      {pos.currentStep > 1 && (
        <POSWizardNavigation
          currentStep={pos.currentStep}
          canProceedNext={canProceedNext}
          canFinalize={pos.canFinalize}
          saving={pos.saving}
          onNext={pos.nextStep}
          onBack={pos.prevStep}
          onFinalize={pos.submitOrder}
          onReset={pos.resetAll}
        />
      )}

      {/* Close session modal */}
      <POSCloseSessionModal
        isOpen={pos.showCloseSessionModal}
        session={pos.session}
        totalSales={pos.sessionTotalSales}
        isClosing={pos.closingSession}
        onClose={pos.handleCloseSession}
        onCancel={pos.cancelCloseSession}
      />
    </div>
  );
}
