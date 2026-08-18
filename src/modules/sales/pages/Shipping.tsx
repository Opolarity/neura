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
import { ComponentPermission } from '@/shared/components/component-permission';


// Nombre, Precio, Zonas, Acciones. Si el rol no puede editar ni eliminar, la
// columna de Acciones no se pinta y este número queda uno largo: solo afecta a
// las filas de "cargando" y "no hay métodos", y la columna sobrante colapsa a
// 0px porque ninguna otra fila la ocupa.
//
// Antes ponía 9, heredado de la tabla de Productos al copiar la pantalla. El
// navegador lo recortaba al número real de columnas, así que no se veía nada
// raro, pero el valor correcto es 4.
const COL_SPAN = 4;

// Codes de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["shipments.edit", "shipments.delete"];

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
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Envío</h1>
          <p className="text-muted-foreground">Gestiona los métodos de envío y sus costos por zona</p>
        </div>
        <div>
          <ComponentPermission codeIn={["shipments.create"]}>
            <Link to="/shipping/create" >
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Método de Envío
              </Button>
            </Link>
          </ComponentPermission>
        </div>

      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <ShippingFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">    <Table>
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
              {/* Se envuelve el th entero y no su texto: una celda vacía sigue
                  ocupando su ancho y deja un hueco muerto. */}
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableHead className="min-w-[120px]">Acciones</TableHead>
              </ComponentPermission>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && shippings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_SPAN} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando métodos de envío...
                  </div>
                </TableCell>
              </TableRow>
            ) : shippings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_SPAN} className="text-center py-8 text-gray-500">
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
                  <ComponentPermission codeIn={ACTION_CODES}>
                    <TableCell>
                      <div className="flex gap-2">
                        <ComponentPermission codeIn={["shipments.edit"]}>
                          <Link to={`/shipping/edit/${shipping.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </ComponentPermission>
                        <ComponentPermission codeIn={["shipments.delete"]}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(shipping)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </ComponentPermission>
                      </div>
                    </TableCell>
                  </ComponentPermission>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>

        <CardFooter className="!p-0">
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
