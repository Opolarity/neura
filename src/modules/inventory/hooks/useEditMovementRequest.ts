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
  const [outWarehouseId, setOutWarehouseId] = useState<number | null>(null);
  const [inWarehouseId, setInWarehouseId] = useState<number | null>(null);
  const [inWarehouseName, setInWarehouseName] = useState<string>("");
  const [reason, setReason] = useState("");
  const [situationName, setSituationName] = useState("");
  const [statusName, setStatusName] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [currentSituationCode, setCurrentSituationCode] = useState("");
  const [isDirectSend, setIsDirectSend] = useState(false);
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

      // Load user, warehouses, and request data from edge function
      const [userRes, warehousesRes, edgeRes] = await Promise.all([
        getUserWarehouse(),
        getWarehousesIsActiveTrue(),
        supabase.functions.invoke(`get-stock-movement-request?id=${requestId}`, {
          method: "GET",
        }),
      ]);

      const userAdp = getUserWarehouseAdapter(userRes);
      setUserSummary(userAdp);

      if (edgeRes.error) throw edgeRes.error;
      const respData = edgeRes.data;
      if (!respData.success || !respData.request) {
        throw new Error(respData.error || "Error al obtener la solicitud");
      }

      const reqData = respData.request;

      // Set warehouses (exclude user's own)
      const allWarehouses = (warehousesRes || []).map((w) => ({ id: w.id, name: w.name }));
      const otherWarehouses = allWarehouses.filter((w) => w.id !== userAdp.warehouse_id);
      setWarehouses(otherWarehouses);

      // Set selected warehouse (out_warehouse = origin)
      const outWarehouseIdNum = reqData.out_warehouse?.id;
      const inWarehouseIdNum = reqData.in_warehouse?.id;
      const outWh = allWarehouses.find((w) => w.id === outWarehouseIdNum);
      if (outWh) setSelectedWarehouse(outWh);
      setOutWarehouseId(outWarehouseIdNum ?? null);
      setInWarehouseId(inWarehouseIdNum ?? null);
      setInWarehouseName(reqData.in_warehouse?.name ?? "");

      // Set situation data
      const currentSit = reqData.current_situation;
      if (currentSit) {
        setStatusName(currentSit.status?.name ?? "");
        setStatusCode(currentSit.status?.code ?? "");
        setSituationName(currentSit.situation?.name ?? "");
        setCurrentSituationCode(currentSit.situation?.code ?? "");
        setReason(currentSit.message ?? "");
      }
      setCreatedAt(reqData.created_at);

      // Fetch user names for history
      const historyList = reqData.history || [];
      const createdByIds = [...new Set<string>(historyList.map((s: any) => s.created_by).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      
      if (historyList.length > 0) {
        // Evaluate if this movement was a CreateSendMovement (initial situation was ENV)
        const firstSit = historyList[historyList.length - 1]; // Last item since it is descending by created_at
        setIsDirectSend(firstSit.situation?.code === "ENV");
      }

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

      const historyItems: SituationHistoryItem[] = (reqData.history || []).map((s: any) => ({
        id: s.id,
        created_at: s.created_at,
        userName: profilesMap[s.created_by] || "Usuario",
        message: s.message,
        situationName: s.situation?.name ?? "",
        notes: s.notes,
        warehouseName: s.warehouse?.name ?? null,
        warehouseId: s.warehouse?.id ?? null,
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
          .select("id, name, status_id, code, statuses!inner(code)")
          .eq("module_id", strModule.id)
          .neq("code", "REQ")
          .order("order", { ascending: true });
        setSituationOptions((sitOptions || []).map((s: any) => ({ id: s.id, name: s.name, status_id: s.status_id, code: s.code, statusCode: s.statuses?.code ?? null })));
      }

      // Map products based on items from edge function
      const items = reqData.items || [];
      if (outWh && items.length > 0) {
        const editProducts: SelectedRequestProduct[] = [];
        const ids = new Set<number>();

        for (const it of items) {
          const varId = it.variation_id;
          const isDisapproved = it.out_movement?.approved === false;
          const movQuantity = it.out_movement?.quantity ?? 0;

          // Optional terms mapping for the UI
          const mappedTerms = (it.variation_terms || []).map((vt: any) => ({
            id: vt.term?.id,
            name: vt.term?.name,
            groupCode: vt.term?.term_group?.code,
          }));

          editProducts.push({
            productId: it.product?.id ?? 0,
            productTitle: it.product?.title ?? "",
            sku: it.sku ?? "",
            variationId: varId,
            stock: 0, 
            imageUrl: null,
            terms: mappedTerms,
            
            quantity: isDisapproved ? 0 : Math.abs(movQuantity),
            sourceStock: it.stock_out_warehouse ?? 0,
            myStock: it.stock_in_warehouse ?? 0,
            disapproved: isDisapproved,
            
            outMovementId: it.out_movement?.id,
            inMovementId: it.in_movement?.id,
            stockTypeId: it.out_movement?.stock_type?.id,
          });
          ids.add(varId);
        }

        setSelectedProducts(editProducts);
        setOriginalQuantities(new Map(editProducts.map((p) => [p.variationId, p.disapproved ? 0 : Math.abs(p.quantity ?? 0)])));
        setSelectedIds(ids);

        // Load products list for search
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

  const toggleDisapprove = (variationId: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.variationId !== variationId) return p;
        const nowDisapproved = !p.disapproved;
        if (nowDisapproved) {
          return { ...p, disapproved: true, quantity: 0 };
        } else {
          // Restore original quantity
          const origQty = originalQuantities.get(variationId) ?? null;
          return { ...p, disapproved: false, quantity: origQty };
        }
      })
    );
  };

  const isSourceWarehouseUser = userSummary ? userSummary.warehouse_id === outWarehouseId : false;

  const generateNotes = (): string => {
    return selectedProducts
      .map((p) => {
        const variationLabel = p.terms && p.terms.length > 0 ? ` (${p.terms.map((t) => t.name).join("-")})` : "";
        if (p.disapproved) {
          return `${p.productTitle}${variationLabel}: 0 - Desaprobado`;
        }
        if (p.quantity && p.quantity > 0) {
          return `${p.productTitle}${variationLabel}: ${p.quantity}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");
  };

  const submitNewSituation = async (message: string, situationId: number) => {
    setSubmittingNewSituation(true);
    try {
      const requestId = Number(id);
      if (!requestId || !userSummary) throw new Error("Datos inválidos");
      if (!message.trim()) throw new Error("El mensaje es obligatorio");

      // Validate: non-disapproved products must have quantity > 0
      const invalidProducts = selectedProducts.filter((p) => !p.disapproved && (!p.quantity || p.quantity <= 0));
      if (invalidProducts.length > 0) {
        toast({
          title: "Cantidad inválida",
          description: "Todos los productos no desaprobados deben tener una cantidad mayor a cero.",
          variant: "destructive",
        });
        setSubmittingNewSituation(false);
        return;
      }

      const selectedSit = situationOptions.find((s) => s.id === situationId);
      if (!selectedSit) throw new Error("Situación inválida");

      // Map payload items from selectedProducts
      const isApproving = selectedSit.code === "APR" || selectedSit.code === "ENV";
      
      // CFM validation equivalent:
      if (isApproving) {
        const approvedProducts = selectedProducts.filter((p) => !p.disapproved);
        if (approvedProducts.length === 0) {
          toast({
            title: "No se puede confirmar",
            description: "Debe haber al menos un producto aprobado (no desaprobado).",
            variant: "destructive",
          });
          setSubmittingNewSituation(false);
          return;
        }
      }

      const payloadItems = selectedProducts
        .filter((p) => p.outMovementId && p.inMovementId)
        .map((p) => {
          let approvedValue: boolean | null = null;
          if (p.disapproved) {
            approvedValue = false;
          } else if (isApproving || selectedSit.code === "REC") {
            approvedValue = true;
          }

          return {
            out_movement_id: p.outMovementId,
            in_movement_id: p.inMovementId,
            approved: approvedValue,
            quantity: p.quantity ?? 0,
            stock_type_id: p.stockTypeId,
          };
        });

      if (payloadItems.length === 0) {
        throw new Error("No hay items para enviar en la solicitud.");
      }

      const notes = generateNotes();
      const combinedMessage = notes ? `${message}\n\n${notes}` : message;

      const { data, error } = await supabase.functions.invoke('approve-stock-movement-items', {
        body: {
          stock_movement_request_id: requestId,
          situation_code: selectedSit.code,
          message: combinedMessage,
          items: payloadItems,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al procesar la actualización");

      // Update current status/situation display locally if we were to stay on page
      setStatusName("");
      setSituationName(selectedSit.name);

      toast({ title: "Actualización enviada", description: "El historial ha sido actualizado." });

      navigate("/inventory/movement-requests");
    } catch (error: any) {
      console.error("Error submitting situation:", error);
      toast({ title: "Error", description: error.message || "No se pudo enviar la actualización.", variant: "destructive" });
    } finally {
      setSubmittingNewSituation(false);
    }
  };

  const quantitiesChanged = selectedProducts.some((p) => {
    const original = originalQuantities.get(p.variationId);
    return original !== undefined && (p.quantity ?? 0) !== original;
  });

  // Filter situation options based on user's warehouse
  const filteredSituationOptions = situationOptions.filter((s) => {
    if (!userSummary) return false;
    const userWh = userSummary.warehouse_id;
    const isSender = userWh === outWarehouseId;
    const isReceiver = userWh === inWarehouseId;

    if (s.code === "CAN") {
      return isSender || isReceiver; // Ambos pueden cancelar
    }

    if (s.code === "REC") {
      // Solo el que recibe puede marcar como recibido, si el estado actual es ENV
      return isReceiver && currentSituationCode === "ENV";
    }

    if (s.code === "NEG") {
      // Solo el que recibe puede negociar, PERO no en envios directos, y no si ya esta enviado o recibido
      return isReceiver && !isDirectSend && currentSituationCode !== "ENV" && currentSituationCode !== "REC";
    }

    if (s.code === "ENV" || s.code === "APR") {
      // Solo el que envia puede aprobar/enviar, PERO no si ya esta enviado
      return isSender && currentSituationCode !== "ENV";
    }

    return true;
  });
  
  const isReadOnly = currentSituationCode === "CAN" || currentSituationCode === "REC";

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
    filteredSituationOptions,
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
    toggleDisapprove,
    isSourceWarehouseUser,
    isReadOnly,
    inWarehouseName,
  };
};
