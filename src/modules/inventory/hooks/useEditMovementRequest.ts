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
import { SituationHistoryItem, SituationOption } from "../components/edit-movement-request/RequestSituationsHistory";

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
  const [situationsHistory, setSituationsHistory] = useState<SituationHistoryItem[]>([]);
  const [situationOptions, setSituationOptions] = useState<SituationOption[]>([]);
  const [submittingNewSituation, setSubmittingNewSituation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductSales[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSales | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedRequestProduct[]>([]);
  const [originalQuantities, setOriginalQuantities] = useState<Map<number, number>>(new Map());
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

      // Load ALL situations history
      const { data: allSituations } = await supabase
        .from("stock_movement_request_situations")
        .select(`
          id, created_at, created_by, message, notes, situation_id, warehouse_id,
          situations(name),
          warehouses!stock_movement_request_situations_warehouse_id_fkey(name)
        `)
        .eq("stock_movement_request_id", requestId)
        .order("created_at", { ascending: true });

      // Fetch user names for each created_by
      const createdByIds = [...new Set((allSituations || []).map((s: any) => s.created_by).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (createdByIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("UID, accounts!profiles_account_id_fkey(name, last_name, last_name2)")
          .in("UID", createdByIds);
        for (const p of (profilesData || []) as any[]) {
          const acc = p.accounts;
          profilesMap[p.UID] = acc
            ? [acc.name, acc.last_name, acc.last_name2].filter(Boolean).join(" ")
            : "Usuario";
        }
      }

      const historyItems: SituationHistoryItem[] = (allSituations || []).map((s: any) => ({
        id: s.id,
        created_at: s.created_at,
        userName: profilesMap[s.created_by] || "Usuario",
        message: s.message,
        situationName: s.situations?.name ?? "",
        notes: s.notes,
        warehouseName: s.warehouses?.name ?? null,
      }));
      setSituationsHistory(historyItems);

      // Load available situations for STR module
      const { data: strModule } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "STR")
        .single();
      if (strModule) {
        const { data: sitOptions } = await supabase
          .from("situations")
          .select("id, name, status_id, code")
          .eq("module_id", strModule.id)
          .neq("code", "REQ")
          .order("order", { ascending: true });
        setSituationOptions((sitOptions || []).map((s: any) => ({ id: s.id, name: s.name, status_id: s.status_id, code: s.code })));
      }
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
        setOriginalQuantities(new Map(editProducts.map((p) => [p.variationId, Math.abs(p.quantity ?? 0)])));
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

  const generateNotes = (): string => {
    return selectedProducts
      .filter((p) => p.quantity && p.quantity > 0)
      .map((p) => {
        const variationLabel = p.terms && p.terms.length > 0 ? ` (${p.terms.map((t) => t.name).join("-")})` : "";
        return `${p.productTitle}${variationLabel}: ${p.quantity}`;
      })
      .join("\n");
  };

  const submitNewSituation = async (message: string, situationId: number) => {
    setSubmittingNewSituation(true);
    try {
      const requestId = Number(id);
      if (!requestId || !userSummary) throw new Error("Datos inválidos");
      if (!message.trim()) throw new Error("El mensaje es obligatorio");

      const selectedSit = situationOptions.find((s) => s.id === situationId);
      if (!selectedSit) throw new Error("Situación inválida");

      const { data: strModule } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "STR")
        .single();
      if (!strModule) throw new Error("Módulo STR no encontrado");

      const notes = generateNotes();

      // Set ALL previous situations for this request to last_row = false
      await supabase
        .from("stock_movement_request_situations")
        .update({ last_row: false })
        .eq("stock_movement_request_id", requestId);

      // Insert new situation
      await supabase
        .from("stock_movement_request_situations")
        .insert({
          stock_movement_request_id: requestId,
          situation_id: situationId,
          status_id: selectedSit.status_id,
          module_id: strModule.id,
          message,
          notes: notes || null,
          warehouse_id: userSummary.warehouse_id,
          last_row: true,
        });

      // Update current status/situation display
      setStatusName("");
      setSituationName(selectedSit.name);

      toast({ title: "Actualización enviada", description: "El historial ha sido actualizado." });

      navigate("/inventory/movement-requests");
    } catch (error) {
      console.error("Error submitting situation:", error);
      toast({ title: "Error", description: "No se pudo enviar la actualización.", variant: "destructive" });
    } finally {
      setSubmittingNewSituation(false);
    }
  };

  const quantitiesChanged = selectedProducts.some((p) => {
    const original = originalQuantities.get(p.variationId);
    return original !== undefined && (p.quantity ?? 0) !== original;
  });

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
    situationsHistory,
    situationOptions,
    submittingNewSituation,
    generateNotes,
    submitNewSituation,
    quantitiesChanged,
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
