import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Barcode } from "lucide-react";
import type { POSCartItem } from "../../../types/POS.types";
import type { PaginatedProductVariation, PaginationMeta } from "../../../types";
import { formatCurrency } from "../../../adapters/POS.adapter";

interface ProductsStepProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: PaginatedProductVariation[];
  productsLoading: boolean;
  cart: POSCartItem[];
  onAddToCart: (product: PaginatedProductVariation) => boolean;
  onUpdateQuantity: (index: number, field: "quantity", value: number) => void;
  onRemoveFromCart: (index: number) => void;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  priceListId: string;
  total: number;
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
}: ProductsStepProps) {
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

      <div className="grid grid-cols-3 gap-6">
        {/* Product search and list */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-4">
              {/* Search bar */}
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
        <Card>
          <CardHeader className="pb-3 space-y-2">
            {cart.length > 0 && (
              <div className="flex justify-between items-center bg-primary/10 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-primary">TOTAL</span>
                <span className="text-lg font-bold text-primary">
                  S/ {formatCurrency(total)}
                </span>
              </div>
            )}
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrito ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Agregue productos al carrito
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
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
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.variationName}
                        </div>
                        <div className="text-xs text-gray-500">
                          S/ {formatCurrency(item.price)} c/u
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
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
                      <div className="font-semibold text-sm">
                        S/ {formatCurrency(item.quantity * item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
