import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Save, Loader2 } from 'lucide-react';
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
    getStockValue,
    handleEdit,
    handleCancel,
    handleSave,
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
    </div>
  );
};

export default Inventory;