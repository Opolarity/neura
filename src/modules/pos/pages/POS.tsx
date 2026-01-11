import { usePos } from "../hooks/usePos";
import { PosHeader } from "../components/filters/PosHeader";
import { ProductGrid } from "../components/products/ProductGrid";
import { CartSidebar } from "../components/order/CartSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VariationSelector } from "../components/products/VariationSelector";
import { CustomerSelector } from "../components/order/CustomerSelector";
import { useState } from "react";
import { Product } from "../../products/products.types";

const POS = () => {
  const {
    products,
    loading,
    search,
    setSearch,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    totals,
  } = usePos();

  const [selectedProductForVariations, setSelectedProductForVariations] = useState<Product | null>(null);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleAddToCartClick = (product: Product) => {
    if (product.is_variable && product.variations && product.variations.length > 0) {
      setSelectedProductForVariations(product);
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-gray-50 -m-6">
      {/* Left side: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <PosHeader
              search={search}
              onSearchChange={setSearch}
              onOpenCustomerSelector={() => setIsCustomerSelectorOpen(true)}
              selectedCustomer={selectedCustomer}
            />
            <ProductGrid
              products={products}
              loading={loading}
              onAddToCart={handleAddToCartClick}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Right side: Cart */}
      <CartSidebar
        cart={cart}
        totals={totals}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />

      <VariationSelector
        product={selectedProductForVariations}
        isOpen={!!selectedProductForVariations}
        onClose={() => setSelectedProductForVariations(null)}
        onAddToCart={(product, variation, quantity) => addToCart(product, variation, quantity)}
      />

      <CustomerSelector
        isOpen={isCustomerSelectorOpen}
        onClose={() => setIsCustomerSelectorOpen(false)}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setIsCustomerSelectorOpen(false);
        }}
      />
    </div>
  );
};

export default POS;
