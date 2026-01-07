import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/index";
import { ProductData } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setProducts(await getProducts());
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  return {
    loading,
    search,
    setSearch,
    products: filteredProducts,
    reload: loadProducts,
  };
};
