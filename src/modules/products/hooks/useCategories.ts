import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCategories, getCategoryProductCounts } from "../services";
import { Category } from "../types";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [cats, counts] = await Promise.all([
        getCategories(),
        getCategoryProductCounts(),
      ]);
      setCategories(cats);
      setProductCounts(counts);
    } catch (error: any) {
      toast.error("Error al cargar categorías: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    productCounts,
    loading,
    reload: loadCategories,
  };
};
