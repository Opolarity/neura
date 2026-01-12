import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ProductCostItem = {
  variation_id: number;
  sku: string;
  product_name: string;
  variation_name: string;
  product_cost: number | null;
};

export const useProductCosts = () => {
  const [products, setProducts] = useState<ProductCostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editedCosts, setEditedCosts] = useState<Record<number, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProductCosts();
  }, []);

  const loadProductCosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-product-costs');

      if (error) throw error;

      setProducts(data.products);
    } catch (error: any) {
      console.error('Error loading product costs:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar los costos de productos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (variationId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setEditedCosts(prev => ({
      ...prev,
      [variationId]: numValue,
    }));
    
    setHasChanges(true);
  };

  const getCostValue = (variationId: number, originalCost: number | null) => {
    return editedCosts[variationId] !== undefined ? editedCosts[variationId] : (originalCost || 0);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCosts({});
    setHasChanges(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCosts({});
    setHasChanges(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const costUpdates = Object.entries(editedCosts).map(([variationId, cost]) => ({
        variation_id: parseInt(variationId),
        product_cost: cost,
      }));

      const { error } = await supabase.functions.invoke('update-product-costs', {
        body: { costUpdates },
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Costos actualizados correctamente',
      });

      setIsEditing(false);
      setEditedCosts({});
      setHasChanges(false);
      
      await loadProductCosts();
    } catch (error: any) {
      console.error('Error saving costs:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar los costos',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    products,
    loading,
    isEditing,
    isSaving,
    hasChanges,
    handleCostChange,
    getCostValue,
    handleEdit,
    handleCancel,
    handleSave,
  };
};
