import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { productCostsApi } from "../services/ProductCosts.service";
import { productCostsAdapter } from "../adapters/ProductCosts.adapter";
import { ProductCost } from "../types/ProductCosts.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { toastError } from "@/shared/utils/toastError";

export const useProductCostsLogic = () => {
  const [products, setProducts] = useState<ProductCost[]>([]);
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
      const dataProductCosts = await productCostsApi();
      const { products, pagination } = productCostsAdapter(dataProductCosts);

      setProducts(products);
    } catch (error: any) {
      console.error("Error loading product costs:", error);
      toastError(error, "No se pudo cargar los costos de productos");
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (variationId: number, value: string) => {
    const numValue = parseFloat(value) || 0;

    setEditedCosts((prev) => ({
      ...prev,
      [variationId]: numValue,
    }));

    setHasChanges(true);
  };

  const getCostValue = (variationId: number, originalCost: number | null) => {
    return editedCosts[variationId] !== undefined
      ? editedCosts[variationId]
      : originalCost || 0;
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

      const costUpdates = Object.entries(editedCosts).map(
        ([variationId, cost]) => ({
          variation_id: parseInt(variationId),
          product_cost: cost,
        })
      );

      await invokeFunction(
        "update-product-costs",
        {
          body: { costUpdates },
        }
      );

      toast({
        title: "Éxito",
        description: "Costos actualizados correctamente",
        variant: "success",
      });

      setIsEditing(false);
      setEditedCosts({});
      setHasChanges(false);

      await loadProductCosts();
    } catch (error: any) {
      console.error("Error saving costs:", error);
      toastError(error, "No se pudo actualizar los costos");
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
