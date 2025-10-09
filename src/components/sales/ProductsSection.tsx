import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface ProductsSectionProps {
  products: any[];
  salesData: any;
  selectedProduct: string;
  selectedVariation: string;
  onProductChange: (value: string) => void;
  onVariationChange: (value: string) => void;
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  onUpdateProduct: (index: number, field: string, value: any) => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  salesData,
  selectedProduct,
  selectedVariation,
  onProductChange,
  onVariationChange,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct,
}) => {
  const selectedProductData = salesData?.products.find((p: any) => p.id.toString() === selectedProduct);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Producto</Label>
            <Select value={selectedProduct} onValueChange={onProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione producto" />
              </SelectTrigger>
              <SelectContent>
                {salesData?.products.map((p: any) => (
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
              onValueChange={onVariationChange}
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
            <Button type="button" onClick={onAddProduct} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {products.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
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
                        min="1"
                        value={product.quantity}
                        onChange={(e) => onUpdateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => onUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.discount}
                        onChange={(e) => onUpdateProduct(index, 'discount', parseFloat(e.target.value) || 0)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(product.quantity * product.price - product.quantity * product.discount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveProduct(index)}
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};
