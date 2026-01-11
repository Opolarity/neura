import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { inventoryService } from '../services/inventory.service';
import { InventoryItem, Warehouse } from '../inventory.types';
import { updateStockStore } from '../store/inventory';

export const useInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editedStock, setEditedStock] = useState<Record<string, number>>({});
    const [editedDefects, setEditedDefects] = useState<Record<string, number>>({});
    const { toast } = useToast();

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getInventory();
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

            await updateStockStore(stockUpdates, defectsUpdates);

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
    };
};
