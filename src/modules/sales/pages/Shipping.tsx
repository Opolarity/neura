import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit, Trash } from 'lucide-react';
import { useShipping } from '../hooks/useShipping';
import ShippingFilterBar from '../components/shipping/ShippingFilterBar';
import { Checkbox } from '@radix-ui/react-checkbox';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import ShippingFilterModal from '../components/shipping/ShippingFilterModal';
import { Link } from 'react-router-dom';


const Shipping = () => {
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
  } = useShipping();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Envío</h1>
          <p className="text-muted-foreground">Gestiona los métodos de envío y sus costos por zona</p>
        </div>
        <div>
          <Link to="/sales/shipping/create" >
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando productos...
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
                  <TableCell>S/ {shipping.cost}</TableCell>
                  <TableCell>{shipping.zones}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { }}
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
    </div>
  );
};

export default Shipping;
