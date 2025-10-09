import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type StockByWarehouse = {
  warehouse_id: number;
  warehouse_name: string;
  stock: number;
};

type InventoryItem = {
  variation_id: number;
  sku: string;
  product_name: string;
  variation_name: string;
  stock_by_warehouse: StockByWarehouse[];
};

type Warehouse = {
  id: number;
  name: string;
};

export const useInventory = () => {
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

  return {
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
  };
};
