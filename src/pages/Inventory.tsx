import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, Loader2 } from 'lucide-react';
import { useInventoryLogic } from './Inventory.logic';

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-inventory');

      if (error) throw error;

      setInventory(data.inventory);
      setWarehouses(data.warehouses);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (variationId: number, warehouseId: number, value: string) => {
    const key = `${variationId}-${warehouseId}`;
    const numValue = parseInt(value) || 0;
    
    setEditedStock(prev => ({
      ...prev,
      [key]: numValue,
    }));
    
    setHasChanges(true);
  };

  const getStockValue = (variationId: number, warehouseId: number, originalStock: number) => {
    const key = `${variationId}-${warehouseId}`;
    return editedStock[key] !== undefined ? editedStock[key] : originalStock;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedStock({});
    setHasChanges(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStock({});
    setHasChanges(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Build stock updates array
      const stockUpdates = Object.entries(editedStock).map(([key, stock]) => {
        const [variationId, warehouseId] = key.split('-').map(Number);
        return {
          variation_id: variationId,
          warehouse_id: warehouseId,
          stock,
        };
      });

      const { error } = await supabase.functions.invoke('update-stock', {
        body: { stockUpdates },
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Inventario actualizado correctamente',
      });

      setIsEditing(false);
      setEditedStock({});
      setHasChanges(false);
      
      // Reload inventory
      await loadInventory();
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el inventario',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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