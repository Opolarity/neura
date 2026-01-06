import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash, Search, Loader2 } from 'lucide-react';
import placeholderImage from '@/assets/product-placeholder.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProductsLogic } from '../store/Products.logic';

const Products = () => {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProducts,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    deleting,
    handleNewProduct,
    toggleSelectAll,
    toggleProductSelection,
    handleBulkDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditProduct,
    getProductPrice,
    getProductStock,
    getProductStatus,
  } = useProductsLogic();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600">Administra tu catálogo de productos</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash className="w-4 h-4" />
              Eliminar {selectedProducts.length} seleccionados
            </Button>
          )}
          <Button onClick={handleNewProduct} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={() => toggleSelectAll()}
                  />
                </TableHead>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Producto</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando productos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={product.images[0]?.image_url || placeholderImage}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>
                        {product.categories.length > 0
                          ? product.categories.join(', ')
                          : 'Sin categoría'}
                      </TableCell>
                      <TableCell>S/ {price}</TableCell>
                      <TableCell>{stock}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                          {status.text}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product.id)}
                          >
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
            <AlertDialogTitle>
              {productToDelete === -1
                ? `¿Eliminar ${selectedProducts.length} productos?`
                : '¿Eliminar producto?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará{productToDelete === -1 ? 'n los productos' : ' el producto'} y todos sus registros relacionados
              (variaciones, precios, stock, imágenes, etc.). Solo se puede eliminar si no está{productToDelete === -1 ? 'n' : ''} vinculado{productToDelete === -1 ? 's' : ''} a ninguna orden.
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
