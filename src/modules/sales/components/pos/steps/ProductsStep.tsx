import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Barcode, Percent, ChevronDown, ChevronUp } from "lucide-react";
import type { POSCartItem } from "../../../types/POS.types";
import type { PaginatedProductVariation, PaginationMeta } from "../../../types";
import { formatCurrency } from "../../../adapters/POS.adapter";
import { useState } from "react";

interface ProductsStepProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: PaginatedProductVariation[];
  productsLoading: boolean;
  cart: POSCartItem[];
  onAddToCart: (product: PaginatedProductVariation) => boolean;
  onUpdateQuantity: (index: number, field: "quantity" | "discountAmount", value: number) => void;
  onRemoveFromCart: (index: number) => void;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  priceListId: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  stockTypes: Array<{ id: number; name: string }>;
  selectedStockTypeId: string;
  onStockTypeChange: (value: string) => void;
  generalDiscount: number;
  onGeneralDiscountChange: (value: number) => void;
}

export default function ProductsStep({
  searchQuery,
  onSearchChange,
  products,
  productsLoading,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  pagination,
  priceListId,
  total,
  subtotal,
  discountAmount,
  stockTypes,
  selectedStockTypeId,
  onStockTypeChange,
  generalDiscount,
  onGeneralDiscountChange,
}: ProductsStepProps) {
  const [expandedDiscounts, setExpandedDiscounts] = useState<Set<number>>(new Set());

  const toggleDiscount = (index: number) => {
    setExpandedDiscounts(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };
  const getProductPrice = (product: PaginatedProductVariation): number => {
    const priceEntry = product.prices.find(
      (p) => p.price_list_id === parseInt(priceListId)
    );
    return priceEntry?.sale_price || priceEntry?.price || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold">Seleccion de Productos</h2>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Product search and list */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-4">
              {/* Search bar and stock type selector */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Escanear SKU o buscar por nombre..."
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStockTypeId} onValueChange={onStockTypeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo inventario" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2">
                  <Barcode className="w-4 h-4" />
                  F2 Scanner
                </Button>
              </div>

              {/* Products table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Buscando productos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        {searchQuery
                          ? "No se encontraron productos"
                          : "Ingrese un termino de busqueda"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.variationId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productTitle}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {product.productTitle}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.terms.map((t) => t.name).join(" / ") ||
                                  product.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          S/ {formatCurrency(getProductPrice(product))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock <= 0}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination info */}
              {pagination.total > 0 && (
                <div className="text-xs text-gray-500 mt-4 text-center">
                  Mostrando {products.length} de {pagination.total} productos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <Card className="self-start col-span-2">
          <CardHeader className="pb-3 space-y-2">
            {cart.length > 0 && (
              <div className="space-y-1.5 bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium text-foreground">
                    S/ {formatCurrency(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-red-600">Descuento</span>
                    <span className="text-sm font-medium text-red-600">
                      -S/ {formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-1.5">
                  <span className="text-xs font-bold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    S/ {formatCurrency(total)}
                  </span>
                </div>
              </div>
            )}
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrito ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Agregue productos al carrito
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => {
                  const itemTotal = item.quantity * item.price;
                  const itemDiscount = item.discountAmount * item.quantity;
                  const itemFinal = itemTotal - itemDiscount;

                  return (
                    <div
                      key={`${item.variationId}-${item.stockTypeId}`}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.productName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.variationName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            S/ {formatCurrency(item.price)} c/u
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive/80"
                          onClick={() => onRemoveFromCart(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() =>
                              onUpdateQuantity(index, "quantity", item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() =>
                              onUpdateQuantity(index, "quantity", item.quantity + 1)
                            }
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          {itemDiscount > 0 && (
                            <div className="text-xs text-muted-foreground line-through">
                              S/ {formatCurrency(itemTotal)}
                            </div>
                          )}
                          <div className="font-semibold text-sm">
                            S/ {formatCurrency(itemFinal)}
                          </div>
                        </div>
                      </div>

                      {/* Per-item discount toggle */}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        onClick={() => toggleDiscount(index)}
                      >
                        <Percent className="w-3 h-3" />
                        {expandedDiscounts.has(index) ? "Ocultar descuento" : "Añadir descuento"}
                        {expandedDiscounts.has(index) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {expandedDiscounts.has(index) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Dcto. x und:</span>
                          <Input
                            type="number"
                            min={0}
                            max={item.price}
                            step={0.01}
                            value={item.discountAmount || ""}
                            onChange={(e) =>
                              onUpdateQuantity(index, "discountAmount", Math.min(parseFloat(e.target.value) || 0, item.price))
                            }
                            className="h-7 text-xs w-24"
                            placeholder="0.00"
                          />
                          <span className="text-xs text-muted-foreground">S/</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* General discount */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Descuento general</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={generalDiscount || ""}
                      onChange={(e) => onGeneralDiscountChange(parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm w-28"
                      placeholder="0.00"
                    />
                    <span className="text-xs text-muted-foreground">S/</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
