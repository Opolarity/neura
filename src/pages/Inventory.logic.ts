import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type StockByWarehouse = {
  warehouse_id: number;
  warehouse_name: string;
  stock: number;
  defects?: number;
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

export const useInventoryLogic = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [editedDefects, setEditedDefects] = useState<Record<string, number>>({});

  // New filtering states
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState<number | null>(null);
  const [types, setTypes] = useState(9); // Default from edge function
  const [order, setOrder] = useState<string | null>(null);
  const [minstock, setMinstock] = useState<number | null>(null);
  const [maxstock, setMaxstock] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, [page, size, search, warehouse, types, order, minstock, maxstock]);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        search: search || '',
        warehouse: warehouse?.toString() || '',
        types: types.toString(),
        order: order || '',
        minstock: minstock?.toString() || '',
        maxstock: maxstock?.toString() || '',
      }).toString();

      const { data, error } = await supabase.functions.invoke(`get-inventory?${queryString}`);

      if (error) throw error;

      console.log('Inventory data received:', data);

      // Extract the raw data array from the paginated response
      const rawData = data.inventory?.data || [];

      // Group flat rows by variation_id
      const groupedData = rawData.reduce((acc: any[], current: any) => {
        let item = acc.find(i => i.variation_id === current.variation_id);

        if (!item) {
          item = {
            variation_id: current.variation_id,
            sku: current.sku,
            product_name: current.nombre, // Map 'nombre' to 'product_name'
            variation_name: current.terminos, // Map 'terminos' to 'variation_name'
            stock_by_warehouse: []
          };
          acc.push(item);
        }

        // Add current warehouse stock
        item.stock_by_warehouse.push({
          warehouse_id: current.almacen, // Map 'almacen' to 'warehouse_id'
          stock: current.stock
        });

        return acc;
      }, []);

      // Normalize: ensure every variation has an entry for every warehouse
      // This is critical for the table columns to align correctly
      const normalizedData = groupedData.map(item => {
        const fullStockList = warehouses.map(w => {
          const found = item.stock_by_warehouse.find((s: any) => s.warehouse_id === w.id);
          return {
            warehouse_id: w.id,
            warehouse_name: w.name,
            stock: found ? found.stock : 0
          };
        });

        return {
          ...item,
          stock_by_warehouse: fullStockList
        };
      });

      setInventory(normalizedData);
      setTotal(data.inventory?.page?.total || 0);
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

  const handleDefectsChange = (variationId: number, value: string) => {
    const key = `${variationId}-1`;
    const numValue = parseInt(value) || 0;

    setEditedDefects(prev => ({
      ...prev,
      [key]: numValue,
    }));

    setHasChanges(true);
  };

  const getStockValue = (variationId: number, warehouseId: number, originalStock: number) => {
    const key = `${variationId}-${warehouseId}`;
    return editedStock[key] !== undefined ? editedStock[key] : originalStock;
  };

  const getDefectsValue = (variationId: number, originalDefects: number) => {
    const key = `${variationId}-1`;
    return editedDefects[key] !== undefined ? editedDefects[key] : originalDefects;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedStock({});
    setEditedDefects({});
    setHasChanges(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStock({});
    setEditedDefects({});
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

      const defectsUpdates = Object.entries(editedDefects).map(([key, defects]) => {
        const [variationId] = key.split('-').map(Number);
        return {
          variation_id: variationId,
          warehouse_id: 1,
          defects,
        };
      });

      const { error } = await supabase.functions.invoke('update-stock', {
        body: { stockUpdates, defectsUpdates },
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Inventario actualizado correctamente',
      });

      setIsEditing(false);
      setEditedStock({});
      setEditedDefects({});
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
  };
};
