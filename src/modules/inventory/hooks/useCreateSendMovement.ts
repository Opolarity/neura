import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { getSaleProducts, getUserWarehouse } from "../services/Movements.service";
import { getProductSalesAdapter, getUserWarehouseAdapter } from "../adapters/Movements.adapter";
import { createMovementRequestApi } from "../services/MovementRequests.service";
import { supabase } from "@/integrations/supabase/client";
import { createMovementRequestAdapter } from "../adapters/MovementRequests.adapter";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";
import { ProductSales, UserSummary, ProductSalesFilter } from "../types/Movements.types";
import { SelectedRequestProduct } from "../types/MovementRequests.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks";

interface SimpleWarehouse {
  id: number;
  name: string;
}

export const useCreateSendMovement = () => {
  const navigate = useNavigate();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);

  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<SimpleWarehouse | null>(null);

  const [reason, setReason] = useState("");

  const [situationName, setSituationName] = useState("");
  const [statusName, setStatusName] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductSales[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSales | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedRequestProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<ProductSalesFilter>({
    p_page: 1,
    p_size: 10,
    p_search: "",
  });

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (!loadingInitial && debouncedSearch !== filters.p_search) {
      const newFilters = { ...filters, p_search: debouncedSearch, p_page: 1 };
      setFilters(newFilters);
      loadProducts(newFilters);
    }
  }, [debouncedSearch]);

  const loadInitialData = async () => {
    try {
      const [userRes, warehousesRes] = await Promise.all([
        getUserWarehouse(),
        getWarehousesIsActiveTrue(),
      ]);

      const userAdp = getUserWarehouseAdapter(userRes);
      setUserSummary(userAdp);

      // Exclude user's own warehouse from destination list
      const otherWarehouses = (warehousesRes || [])
        .filter((w) => w.id !== userAdp.warehouse_id)
        .map((w) => ({ id: w.id, name: w.name }));
      setWarehouses(otherWarehouses);

      // Fetch situation (CFM) and its parent status for module STR
      const { data: moduleData } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "STR")
        .limit(1)
        .single();

      if (moduleData) {
        const { data: sitData } = await supabase
          .from("situations")
          .select("name, status_id")
          .eq("module_id", moduleData.id)
          .eq("code", "CFM")
          .limit(1)
          .single();

        if (sitData) {
          setSituationName(sitData.name);
          const { data: stData } = await supabase
            .from("statuses")
            .select("name, code")
            .eq("id", sitData.status_id)
            .limit(1)
            .single();
          if (stData) setStatusName(stData.name);
        }
      }

      // Load products from user's own warehouse immediately
      const initialFilters: ProductSalesFilter = {
        p_page: 1,
        p_size: 10,
        p_search: "",
        p_warehouse_id: userAdp.warehouse_id,
      };
      setFilters(initialFilters);
      await loadProducts(initialFilters);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleWarehouseChange = (warehouseId: string) => {
    const wh = warehouses.find((w) => w.id.toString() === warehouseId);
    if (!wh) return;
    setSelectedWarehouse(wh);
    setSelectedProducts([]);
    setSelectedIds(new Set());
    setSelectedProduct(null);
  };

  const loadProducts = async (newFilters: ProductSalesFilter) => {
    setLoadingProducts(true);
    try {
      const responseProducts = await getSaleProducts(newFilters);
      const { data: dataProducts, pagination: newPagination } =
        getProductSalesAdapter(responseProducts);
      setProducts(dataProducts);
      setPagination(newPagination);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const onSelectProduct = (product: ProductSales) => {
    if (product.stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no tiene stock disponible en tu almacén.",
        variant: "destructive",
      });
      return;
    }

    if (selectedIds.has(product.variationId)) {
      toast({
        title: "Producto duplicado",
        description: "Este producto ya fue agregado al envío.",
        variant: "destructive",
      });
      return;
    }

    setSelectedProduct(product);
    setIsOpen(false);
  };

  const addProduct = async () => {
    if (!selectedProduct || !userSummary || !selectedWarehouse) return;
    if (selectedIds.has(selectedProduct.variationId)) return;

    // Fetch destination warehouse stock for this product
    let destStock = 0;
    try {
      const destRes = await getSaleProducts({
        p_page: 1,
        p_size: 1,
        p_search: selectedProduct.sku,
        p_warehouse_id: selectedWarehouse.id,
      });
      const { data: destProducts } = getProductSalesAdapter(destRes);
      const found = destProducts.find((p) => p.variationId === selectedProduct.variationId);
      destStock = found?.stock ?? 0;
    } catch (error) {
      console.error("Error fetching destination stock:", error);
    }

    const newSelected: SelectedRequestProduct = {
      ...selectedProduct,
      quantity: null,
      sourceStock: selectedProduct.stock, // user's own stock
      myStock: destStock, // destination warehouse stock
    };

    setSelectedProducts((prev) => [...prev, newSelected]);
    setSelectedIds((prev) => new Set(prev).add(selectedProduct.variationId));
    setSelectedProduct(null);
  };

  const removeProduct = (variationId: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.variationId !== variationId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(variationId);
      return next;
    });
  };

  const handleQuantityChange = (variationId: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.variationId !== variationId) return p;
        if (sanitized === "") return { ...p, quantity: null };
        const num = Number(sanitized);
        if (num <= 0) return { ...p, quantity: null };
        return { ...p, quantity: Math.min(num, p.sourceStock) };
      })
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, p_page: page };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  const sendMovement = async () => {
    if (!selectedWarehouse || !userSummary) {
      toast({
        title: "Validación",
        description: "Selecciona un almacén de destino.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Validación",
        description: "Agrega al menos un producto al envío.",
        variant: "destructive",
      });
      return;
    }

    const hasInvalid = selectedProducts.some(
      (p) => !p.quantity || p.quantity <= 0
    );
    if (hasInvalid) {
      toast({
        title: "Validación",
        description: "Todos los productos deben tener una cantidad mayor a cero.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Validación",
        description: "Ingresa un motivo para el envío.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // out_warehouse = user's warehouse (sender), in_warehouse = selected (receiver)
      const payload = {
        reason: reason.trim(),
        out_warehouse_id: userSummary.warehouse_id,
        in_warehouse_id: selectedWarehouse.id,
        items: selectedProducts.map((p) => ({
          product_variation_id: p.variationId,
          quantity: p.quantity!,
          stock_type_code: "PRD",
          product_name: p.productTitle,
          variation_label: p.terms.length > 0 ? p.terms.map(t => t.name).join("-") : null,
        })),
        module_code: "STR",
        status_code: "CFM",
        situation_code: "CFM",
        movement_type_code: "TRW",
      };

      const response = await createMovementRequestApi(payload);
      const adapted = createMovementRequestAdapter(response);

      toast({
        title: "Envío creado",
        description: `El envío #${adapted.requestId} fue creado exitosamente.`,
      });
      navigate("/inventory/movement-requests");
    } catch (error) {
      console.error("Error creating send movement:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el envío.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loadingInitial,
    loadingProducts,
    submitting,
    userSummary,
    warehouses,
    selectedWarehouse,
    reason,
    setReason,
    situationName,
    statusName,
    isOpen,
    setIsOpen,
    products,
    selectedProduct,
    selectedProducts,
    selectedIds,
    search,
    pagination,
    handleWarehouseChange,
    onSelectProduct,
    addProduct,
    removeProduct,
    handleQuantityChange,
    handleSearchChange,
    handlePageChange,
    sendMovement,
  };
};
