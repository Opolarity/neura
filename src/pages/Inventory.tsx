import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Edit, Save, Loader2, Search, Filter } from 'lucide-react';
import { useInventoryLogic } from './Inventory.logic';

const Inventory = () => {
  const {
    inventory,
    warehouses,
    loading,
    isEditing,
    isSaving,
    hasChanges,
    handleStockChange,
    handleDefectsChange,
    getStockValue,
    getDefectsValue,
    handleEdit,
    handleCancel,
    handleSave,
    // Filter controls
    page,
    setPage,
    size,
    setSize,
    search,
    setSearch,
    warehouse,
    setWarehouse,
    types,
    setTypes,
    order,
    setOrder,
    minstock,
    setMinstock,
    maxstock,
    setMaxstock,
    total,
  } = useInventoryLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario por Almacén</h1>
          <p className="text-muted-foreground">Gestiona el stock de todas las variaciones</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="SKU o nombre..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Almacén</Label>
              <Select
                value={warehouse?.toString() || "all"}
                onValueChange={(v) => setWarehouse(v === "all" ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los almacenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los almacenes</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={minstock || ''}
                onChange={(e) => setMinstock(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Stock Máximo</Label>
              <Input
                type="number"
                placeholder="Ej: 100"
                value={maxstock || ''}
                onChange={(e) => setMaxstock(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Stock por Variación</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Variación</TableHead>
                  <TableHead className="bg-destructive/10 text-destructive">Fallidos</TableHead>
                  {warehouses.map((warehouse) => (
                    <TableHead key={warehouse.id}>{warehouse.name}</TableHead>
                  ))}
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const total = item.stock_by_warehouse.reduce((sum, stock) => {
                    const value = getStockValue(item.variation_id, stock.warehouse_id, stock.stock);
                    return sum + value;
                  }, 0);

                  return (
                    <TableRow key={item.variation_id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.variation_name}</TableCell>
                      <TableCell className="bg-destructive/5">
                        {(() => {
                          const warehouse1Stock = item.stock_by_warehouse.find(s => s.warehouse_id === 1);
                          const defects = warehouse1Stock?.defects || 0;
                          return (
                            <Input
                              type="number"
                              min="0"
                              value={getDefectsValue(item.variation_id, defects)}
                              onChange={(e) => handleDefectsChange(item.variation_id, e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={!isEditing}
                              className="w-24 bg-destructive/10 border-destructive/20 focus-visible:ring-destructive/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          );
                        })()}
                      </TableCell>
                      {item.stock_by_warehouse.map((stock) => (
                        <TableCell key={stock.warehouse_id}>
                          <Input
                            type="number"
                            min="0"
                            value={getStockValue(item.variation_id, stock.warehouse_id, stock.stock)}
                            onChange={(e) =>
                              handleStockChange(item.variation_id, stock.warehouse_id, e.target.value)
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            disabled={!isEditing}
                            className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold">{total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando página {page} {total > 0 && `de ${Math.ceil(total / size)}`} ({total} resultados)
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>{page}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(page + 1)}
                className={page >= Math.ceil(total / size) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div >
  );
};

export default Inventory;