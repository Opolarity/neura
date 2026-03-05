import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSaleProducts, getUserWarehouse } from "../services/Movements.service";
import { getProductSalesAdapter, getUserWarehouseAdapter } from "../adapters/Movements.adapter";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";
import { ProductSales, UserSummary, ProductSalesFilter } from "../types/Movements.types";
import { SelectedRequestProduct } from "../types/MovementRequests.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks";

interface SimpleWarehouse {
  id: number;
  name: string;
}

export const useEditMovementRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<SimpleWarehouse | null>(null);
  const [reason, setReason] = useState("");
  const [situationName, setSituationName] = useState("");
  const [statusName, setStatusName] = useState("");
  const [createdAt, setCreatedAt] = useState<string>("");

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
      loadProductsList(newFilters);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const requestId = Number(id);
      if (!requestId) throw new Error("ID inválido");

      // Load user, warehouses, and request data in parallel
      const [userRes, warehousesRes, requestRes] = await Promise.all([
        getUserWarehouse(),
        getWarehousesIsActiveTrue(),
        supabase
          .from("stock_movement_requests")
          .select(`
            id, created_by, out_warehouse_id, in_warehouse_id, created_at, updated_at,
            stock_movement_request_situations!inner(
              status_id, situation_id, message, last_row,
              statuses(name),
              situations(name)
            )
          `)
          .eq("id", requestId)
          .eq("stock_movement_request_situations.last_row", true)
          .single(),
      ]);

      const userAdp = getUserWarehouseAdapter(userRes);
      setUserSummary(userAdp);

      if (requestRes.error) throw requestRes.error;
      const reqData = requestRes.data as any;

      // Set warehouses (exclude user's own)
      const allWarehouses = (warehousesRes || []).map((w) => ({ id: w.id, name: w.name }));
      const otherWarehouses = allWarehouses.filter((w) => w.id !== userAdp.warehouse_id);
      setWarehouses(otherWarehouses);

      // Set selected warehouse (out_warehouse = origin)
      const outWh = allWarehouses.find((w) => w.id === reqData.out_warehouse_id);
      if (outWh) setSelectedWarehouse(outWh);

      // Set situation data
      const sit = reqData.stock_movement_request_situations?.[0];
      if (sit) {
        setStatusName(sit.statuses?.name ?? "");
        setSituationName(sit.situations?.name ?? "");
        setReason(sit.message ?? "");
      }
      setCreatedAt(reqData.created_at);

      // Load linked products
      const { data: linkedData } = await supabase
        .from("linked_stock_movement_requests")
        .select(`
          stock_movement_id,
          stock_movements!linked_stock_movement_requests_stock_movement_id_fkey(
            id, product_variation_id, quantity, warehouse_id
          )
        `)
        .eq("stock_movement_request_id", requestId);

      // Get the OUTPUT movements (negative quantity = salida from source warehouse)
      const outputMovements = (linkedData || [])
        .map((l: any) => l.stock_movements)
        .filter((m: any) => m && m.quantity < 0);

      if (outWh && outputMovements.length > 0) {
        // Load product details for each variation
        const variationIds = outputMovements.map((m: any) => m.product_variation_id);
        
        // Fetch current stock for source warehouse
        const sourceFilters: ProductSalesFilter = {
          p_page: 1,
          p_size: 100,
          p_search: "",
          p_warehouse_id: outWh.id,
        };
        const sourceRes = await getSaleProducts(sourceFilters);
        const { data: sourceProducts } = getProductSalesAdapter(sourceRes);

        // Fetch current stock for user's warehouse
        const myFilters: ProductSalesFilter = {
          p_page: 1,
          p_size: 100,
          p_search: "",
          p_warehouse_id: userAdp.warehouse_id,
        };
        const myRes = await getSaleProducts(myFilters);
        const { data: myProducts } = getProductSalesAdapter(myRes);

        const editProducts: SelectedRequestProduct[] = [];
        const ids = new Set<number>();

        for (const mov of outputMovements) {
          const varId = mov.product_variation_id;
          const sourceProd = sourceProducts.find((p) => p.variationId === varId);
          const myProd = myProducts.find((p) => p.variationId === varId);

          if (sourceProd) {
            editProducts.push({
              ...sourceProd,
              quantity: Math.abs(mov.quantity),
              sourceStock: sourceProd.stock,
              myStock: myProd?.stock ?? 0,
            });
            ids.add(varId);
          }
        }

        setSelectedProducts(editProducts);
        setSelectedIds(ids);

        // Also load products list for search
        const defaultFilters: ProductSalesFilter = {
          p_page: 1,
          p_size: 10,
          p_search: "",
          p_warehouse_id: outWh.id,
        };
        setFilters(defaultFilters);
        await loadProductsList(defaultFilters);
      }
    } catch (error) {
      console.error("Error loading request:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadProductsList = async (newFilters: ProductSalesFilter) => {
    setLoadingProducts(true);
    try {
      const responseProducts = await getSaleProducts(newFilters);
      const { data: dataProducts, pagination: newPagination } = getProductSalesAdapter(responseProducts);
      setProducts(dataProducts);
      setPagination(newPagination);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleWarehouseChange = async (warehouseId: string) => {
    const wh = warehouses.find((w) => w.id.toString() === warehouseId);
    if (!wh) return;
    setSelectedWarehouse(wh);
    setSelectedProducts([]);
    setSelectedIds(new Set());
    setSelectedProduct(null);

    const newFilters: ProductSalesFilter = { p_page: 1, p_size: 10, p_search: "", p_warehouse_id: wh.id };
    setFilters(newFilters);
    setSearch("");
    await loadProductsList(newFilters);
  };

  const onSelectProduct = (product: ProductSales) => {
    if (product.stock <= 0) {
      toast({ title: "Sin stock", description: "Sin stock virtual disponible.", variant: "destructive" });
      return;
    }
    if (selectedIds.has(product.variationId)) {
      toast({ title: "Producto duplicado", description: "Ya fue agregado.", variant: "destructive" });
      return;
    }
    setSelectedProduct(product);
    setIsOpen(false);
  };

  const addProduct = async () => {
    if (!selectedProduct || !userSummary) return;
    if (selectedIds.has(selectedProduct.variationId)) return;

    let myStock = 0;
    try {
      const myRes = await getSaleProducts({ p_page: 1, p_size: 1, p_search: selectedProduct.sku, p_warehouse_id: userSummary.warehouse_id });
      const { data: myProducts } = getProductSalesAdapter(myRes);
      const found = myProducts.find((p) => p.variationId === selectedProduct.variationId);
      myStock = found?.stock ?? 0;
    } catch {}

    const newSelected: SelectedRequestProduct = {
      ...selectedProduct,
      quantity: null,
      sourceStock: selectedProduct.stock,
      myStock,
    };
    setSelectedProducts((prev) => [...prev, newSelected]);
    setSelectedIds((prev) => new Set(prev).add(selectedProduct.variationId));
    setSelectedProduct(null);
  };

  const removeProduct = (variationId: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.variationId !== variationId));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(variationId); return next; });
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

  const handleSearchChange = (value: string) => setSearch(value);

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, p_page: page };
    setFilters(newFilters);
    loadProductsList(newFilters);
  };

  return {
    requestId: id,
    loadingInitial,
    loadingProducts,
    userSummary,
    warehouses,
    selectedWarehouse,
    reason,
    setReason,
    situationName,
    statusName,
    createdAt,
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
  };
};
