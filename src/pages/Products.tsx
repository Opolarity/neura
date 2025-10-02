import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash, Search, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface ProductData {
  id: number;
  title: string;
  description?: string;
  short_description: string;
  is_variable: boolean;
  created_at: string;
  categories: string[];
  variations: {
    id: number;
    prices: { price: number; sale_price?: number }[];
    stock: { stock: number }[];
  }[];
}

const Products = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Obtener productos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        return;
      }

      // Para cada producto, obtener sus categorías, variaciones, precios y stock
      const enrichedProducts = await Promise.all(
        productsData.map(async (product) => {
          // Obtener categorías
          const { data: categoriesData } = await supabase
            .from('product_categories')
            .select(`
              categories (
                name
              )
            `)
            .eq('product_id', product.id);

          const categories = categoriesData?.map(cat => cat.categories?.name).filter(Boolean) || [];

          // Obtener variaciones
          const { data: variationsData } = await supabase
            .from('variations')
            .select('id')
            .eq('product_id', product.id);

          const variations = await Promise.all(
            (variationsData || []).map(async (variation) => {
              // Obtener precios de la variación
              const { data: pricesData } = await supabase
                .from('product_price')
                .select('price, sale_price')
                .eq('product_variation_id', variation.id);

              // Obtener stock de la variación
              const { data: stockData } = await supabase
                .from('product_stock')
                .select('stock')
                .eq('product_variation_id', variation.id);

              return {
                id: variation.id,
                prices: pricesData || [],
                stock: stockData || []
              };
            })
          );

          return {
            ...product,
            categories,
            variations
          } as ProductData;
        })
      );

      setProducts(enrichedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleNewProduct = () => {
    navigate('/add-product');
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getProductPrice = (product: ProductData) => {
    if (product.variations.length === 0) return 0;
    const firstVariation = product.variations[0];
    if (firstVariation.prices.length === 0) return 0;
    return firstVariation.prices[0].price || 0;
  };

  const getProductStock = (product: ProductData) => {
    return product.variations.reduce((total, variation) => {
      return total + variation.stock.reduce((varTotal, s) => varTotal + (s.stock || 0), 0);
    }, 0);
  };

  const getProductStatus = (stock: number) => {
    if (stock === 0) return { text: 'Sin Stock', class: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'Stock Bajo', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Activo', class: 'bg-green-100 text-green-800' };
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);

      // 1. Verificar si el producto está en alguna orden
      const { data: variationsData } = await supabase
        .from('variations')
        .select('id')
        .eq('product_id', productToDelete);

      if (variationsData && variationsData.length > 0) {
        const variationIds = variationsData.map(v => v.id);

        const { data: orderProducts } = await supabase
          .from('order_products')
          .select('id')
          .in('product_variation_id', variationIds)
          .limit(1);

        if (orderProducts && orderProducts.length > 0) {
          toast({
            title: "No se puede eliminar",
            description: "Este producto está vinculado a una o más órdenes",
            variant: "destructive",
          });
          setDeleteDialogOpen(false);
          setProductToDelete(null);
          setDeleting(false);
          return;
        }

        // 2. Eliminar registros relacionados en orden
        // Eliminar product_variation_images
        for (const variation of variationsData) {
          await supabase
            .from('product_variation_images')
            .delete()
            .eq('product_variation_id', variation.id);
        }

        // Eliminar product_price
        for (const variation of variationsData) {
          await supabase
            .from('product_price')
            .delete()
            .eq('product_variation_id', variation.id);
        }

        // Eliminar product_stock
        for (const variation of variationsData) {
          await supabase
            .from('product_stock')
            .delete()
            .eq('product_variation_id', variation.id);
        }

        // Eliminar variation_terms
        for (const variation of variationsData) {
          await supabase
            .from('variation_terms')
            .delete()
            .eq('product_variation_id', variation.id);
        }

        // Eliminar variations
        await supabase
          .from('variations')
          .delete()
          .eq('product_id', productToDelete);
      }

      // 3. Eliminar product_categories
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productToDelete);

      // 4. Eliminar product_images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productToDelete);

      // 5. Eliminar el producto
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (deleteError) throw deleteError;

      toast({
        title: "Producto eliminado",
        description: "El producto y todos sus registros relacionados han sido eliminados",
      });

      // Recargar la lista de productos
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600">Administra tu catálogo de productos</p>
        </div>
        <Button onClick={handleNewProduct} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lista de Productos</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando productos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const price = getProductPrice(product);
                  const stock = getProductStock(product);
                  const status = getProductStatus(stock);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>PROD-{product.id.toString().padStart(3, '0')}</TableCell>
                      <TableCell>
                        {product.categories.length > 0 
                          ? product.categories.join(', ') 
                          : 'Sin categoría'}
                      </TableCell>
                      <TableCell>${price.toFixed(2)}</TableCell>
                      <TableCell>{stock}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                          {status.text}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteClick(product.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto y todos sus registros relacionados
              (variaciones, precios, stock, imágenes, etc.). Solo se puede eliminar si no está vinculado a ninguna orden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;