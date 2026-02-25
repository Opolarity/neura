import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash } from 'lucide-react';
import { useShipping } from '../hooks/useShipping';
import ShippingFilterBar from '../components/shipping/ShippingFilterBar';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import ShippingFilterModal from '../components/shipping/ShippingFilterModal';
import { ShippingDeleteDialog } from '../components/shipping/ShippingDeleteDialog';
import type { Shipping } from '../types/Shipping.types';
import { Link } from 'react-router-dom';


const Shipping = () => {
  const [shippingToDelete, setShippingToDelete] = useState<Shipping | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    shippings,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    hasActiveFilters,
    handlePageSizeChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onPageChange,
    onSearchChange,
    onOrderChange,
    onDeleteShipping,
  } = useShipping();

  const handleDeleteClick = (shipping: Shipping) => {
    setShippingToDelete(shipping);
  };

  const handleConfirmDelete = async () => {
    if (!shippingToDelete) return;
    setIsDeleting(true);
    await onDeleteShipping(shippingToDelete.id);
    setIsDeleting(false);
    setShippingToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Envío</h1>
          <p className="text-muted-foreground">Gestiona los métodos de envío y sus costos por zona</p>
        </div>
        <div>
          <Link to="/shipping/create" >
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Método de Envío
            </Button>
          </Link>
        </div>

      </div>

      <Card>
        <CardHeader>
          <ShippingFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0">    <Table>
          <TableHeader>
            <TableRow>
              {/*
              <TableHead className="w-12">
                
                <Checkbox
                  checked={
                    selectedProducts.length === products.length &&
                    products.length > 0
                  }
                  onCheckedChange={() => onToggleAllProductsSelection()}
                />    
                

              </TableHead>*/}
              <TableHead className="min-w-[150px]">Nombre</TableHead>
              <TableHead className="min-w-[100px]">Precio</TableHead>
              <TableHead className="min-w-[200px]">Zonas</TableHead>
              <TableHead className="min-w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && shippings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando métodos de envío...
                  </div>
                </TableCell>
              </TableRow>
            ) : shippings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {search
                    ? "No se encontraron métodos de envío"
                    : "No hay métodos de envío registrados"}
                </TableCell>
              </TableRow>
            ) : (
              shippings.map((shipping) => (
                <TableRow key={shipping.id}>
                  {/*<TableCell>
                    
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => onToggleProductSelection(product.id)}
                    />
                    
                  </TableCell>*/}
                  <TableCell className="font-medium">{shipping.name}</TableCell>
                  <TableCell>
                    {shipping.minCost === shipping.maxCost
                      ? `S/ ${shipping.minCost.toFixed(2)}`
                      : `S/ ${shipping.minCost.toFixed(2)} - S/ ${shipping.maxCost.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{shipping.zones}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link to={`/shipping/edit/${shipping.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(shipping)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>

        <CardFooter>
          <PaginationBar pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
      <ShippingFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
      <ShippingDeleteDialog
        open={!!shippingToDelete}
        onOpenChange={(open) => !open && setShippingToDelete(null)}
        shipping={shippingToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Shipping;
