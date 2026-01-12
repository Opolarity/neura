import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductData {
  id: number;
  title: string;
  short_description: string;
  is_variable: boolean;
  categories: string[];
  images: { image_url: string }[];
  variations: {
    id: number;
    sku: string | null;
    prices: { price: number; sale_price: number | null }[];
    stock: { stock: number }[];
  }[];
}

export const useProductsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "get-products-list"
      );

      if (error) throw error;

      if (!data || !data.products || data.products.length === 0) {
        setProducts([]);
        return;
      }

      console.log("data");

      console.log(data);

      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProduct = () => {
    navigate("/products/add");
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categories.some((cat) =>
          cat.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [products, searchTerm]);

  const getProductPrice = (product: ProductData) => {
    // Collect all prices (both normal and sale prices, ignoring nulls)
    const allPrices: number[] = [];

    product.variations.forEach((variation) => {
      (variation.prices ?? []).forEach(({ price, sale_price }) => {
        // Add normal price if not null
        if (price !== null && price !== undefined) {
          allPrices.push(Number(price));
        }
        // Add sale price if not null (0 is valid)
        if (sale_price !== null && sale_price !== undefined) {
          allPrices.push(Number(sale_price));
        }
      });
    });

    // Filter out only NaN values, keep 0 as valid
    const validPrices = allPrices.filter((p) => !isNaN(p) && p >= 0);

    if (validPrices.length === 0) {
      return "0.00";
    }

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice !== maxPrice) {
      return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
    }

    return `${minPrice.toFixed(2)}`;
  };

  const getProductStock = (product: ProductData) => {
    return product.variations.reduce((total, variation) => {
      return (
        total +
        variation.stock.reduce(
          (variationTotal, stock) => variationTotal + (stock.stock || 0),
          0
        )
      );
    }, 0);
  };

  const getProductStatus = (stock: number) => {
    if (stock === 0)
      return { text: "Sin Stock", class: "bg-red-100 text-red-800" };
    if (stock <= 10)
      return { text: "Stock Bajo", class: "bg-yellow-100 text-yellow-800" };
    return { text: "Activo", class: "bg-green-100 text-green-800" };
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((product) => product.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    setProductToDelete(-1);
    setDeleteDialogOpen(true);
  };

  const handleEditProduct = (productId: number) => {
    navigate(`/products/add?id=${productId}`);
  };

  const handleDeleteConfirm = async () => {
    const productsToDelete =
      productToDelete === -1
        ? selectedProducts
        : productToDelete
        ? [productToDelete]
        : [];
    if (productsToDelete.length === 0) return;

    try {
      setDeleting(true);

      const { data, error } = await supabase.functions.invoke(
        "delete-product",
        {
          body: { productIds: productsToDelete },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Error al eliminar los productos");
      }

      toast({
        title: "Productos eliminados",
        description: `Se eliminaron ${data.deletedCount} producto(s) correctamente`,
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting products:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return {
    fetchProducts,
    loading,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProducts,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    deleting,
    handleNewProduct,
    toggleSelectAll,
    toggleProductSelection,
    handleBulkDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditProduct,
    getProductPrice,
    getProductStock,
    getProductStatus,
  };
};
