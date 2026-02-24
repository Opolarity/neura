// =============================================
// usePOS Hook
// Main logic for Point of Sale page
// =============================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { applyPriceRules } from "../rules/applyPriceRules";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePOSSession } from "./usePOSSession";
import type {
  POSStep,
  POSConfiguration,
  POSCartItem,
  POSCustomerData,
  POSShippingData,
  POSPayment,
  CreatePOSOrderRequest,
  INITIAL_CUSTOMER_DATA,
  INITIAL_SHIPPING_DATA,
} from "../types/POS.types";
import type {
  SalesFormDataResponse,
  ShippingCost,
  PriceList,
  PaginatedProductVariation,
  PaginationMeta,
} from "../types";
import {
  adaptSalesFormData,
  adaptShippingCosts,
  adaptClientSearchResult,
  getIdInventoryTypeAdapter,
} from "../adapters";
import {
  fetchSalesFormData,
  fetchShippingCosts,
  searchClientByDocument,
  lookupDocument,
  fetchSaleProducts,
  getIdInventoryTypeApi,
} from "../services";
import { getPriceListIsActiveTrue, getActivePaymentMethodsBySaleTypeId, getBusinessAccountIsActiveTrue } from "@/shared/services/service";
import { createPOSOrder } from "../services/POS.service";
import { filterShippingCostsByLocation } from "../utils";

// Initial state values
const DEFAULT_CUSTOMER: POSCustomerData = {
  documentTypeId: "",
  documentNumber: "",
  customerName: "",
  customerLastname: "",
  customerLastname2: "",
  email: "",
  phone: "",
  requiresShipping: false,
  isExistingClient: false,
};

const DEFAULT_SHIPPING: POSShippingData = {
  countryId: "",
  stateId: "",
  cityId: "",
  neighborhoodId: "",
  address: "",
  addressReference: "",
  receptionPerson: "",
  receptionPhone: "",
  shippingMethodId: "",
  shippingCost: 0,
};

export const usePOS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const POSSessionHook = usePOSSession();

  // Step state
  const [currentStep, setCurrentStep] = useState<POSStep>(1);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Configuration (Step 1)
  const [configuration, setConfiguration] = useState<POSConfiguration | null>(
    null
  );
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);
  const [userWarehouseName, setUserWarehouseName] = useState<string>("");

  // Form data (dropdown options)
  const [formData, setFormData] = useState<SalesFormDataResponse | null>(null);
  const [allShippingCosts, setAllShippingCosts] = useState<ShippingCost[]>([]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<import("../types").PaymentMethod[]>([]);
  const [businessAccounts, setBusinessAccounts] = useState<Array<{ id: number; name: string; bank: string }>>([]);
  const [sessionSaleTypeId, setSessionSaleTypeId] = useState<number | null>(null);

  // Products (Step 2)
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [paginatedProducts, setPaginatedProducts] = useState<
    PaginatedProductVariation[]
  >([]);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState<PaginationMeta>({
    page: 1,
    size: 10,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStockTypeId, setSelectedStockTypeId] = useState<string>("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Customer (Step 3)
  const [customer, setCustomer] = useState<POSCustomerData>(DEFAULT_CUSTOMER);
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [isAnonymousPurchase, setIsAnonymousPurchase] = useState(false);

  // Shipping (Step 4)
  const [shipping, setShipping] = useState<POSShippingData>(DEFAULT_SHIPPING);

  // Payments (Step 5)
  const [payments, setPayments] = useState<POSPayment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<POSPayment>({
    id: crypto.randomUUID(),
    paymentMethodId: "",
    amount: 0,
    confirmationCode: "",
  });

  // Change entries (vuelto)
  const [changeEntries, setChangeEntries] = useState<POSPayment[]>([]);
  const [currentChangeEntry, setCurrentChangeEntry] = useState<POSPayment>({
    id: crypto.randomUUID(),
    paymentMethodId: "",
    amount: 0,
    confirmationCode: "",
  });

  // =============================================
  // INITIALIZATION
  // =============================================

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced product search
  useEffect(() => {
    if (!configuration?.warehouseId) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setProductPage(1);
      loadProducts(
        1,
        searchQuery,
        selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
        configuration.warehouseId
      );
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, selectedStockTypeId, configuration?.warehouseId]);

  // Apply price rules whenever cart changes
  useEffect(() => {
    if (cart.length === 0) return;
    const run = async () => {
      const updated = await applyPriceRules(cart);
      const changed = updated.some((u, i) => u.price !== cart[i].price);
      if (changed) setCart(updated);
    };
    run();
  }, [cart]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [salesFormData, priceListsData, shippingCostsData, stockTypeData] =
        await Promise.all([
          fetchSalesFormData(),
          getPriceListIsActiveTrue(),
          fetchShippingCosts(),
          getIdInventoryTypeApi(),
        ]);

      setFormData(adaptSalesFormData(salesFormData));
      setPriceLists(priceListsData);
      setAllShippingCosts(adaptShippingCosts(shippingCostsData || []));
      setSelectedStockTypeId(
        getIdInventoryTypeAdapter(stockTypeData).toString()
      );

      // Load user warehouse
      await loadUserWarehouse();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del formulario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserWarehouse = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("warehouse_id, warehouses(id, name)")
      .eq("UID", user.id)
      .single();

    if (profile?.warehouse_id) {
      setUserWarehouseId(profile.warehouse_id);
      const warehouse = Array.isArray(profile.warehouses)
        ? profile.warehouses[0]
        : profile.warehouses;
      setUserWarehouseName((warehouse as { name?: string })?.name || "");
    }
  };

  // Load filtered payment methods based on session's business account → sale type
  useEffect(() => {
    const loadFilteredPaymentMethods = async () => {
      if (!POSSessionHook.session?.businessAccountId) return;
      
      // Find the sale type linked to this business account (POS sale type)
      const { data: saleType } = await supabase
        .from("sale_types")
        .select("id")
        .eq("business_acount_id", POSSessionHook.session.businessAccountId)
        .eq("pos_sale_type", true)
        .eq("is_active", true)
        .maybeSingle();

      if (saleType?.id) {
        setSessionSaleTypeId(saleType.id);
        const methods = await getActivePaymentMethodsBySaleTypeId(saleType.id);
        setFilteredPaymentMethods(methods.map(m => ({
          id: m.id,
          name: m.name,
          businessAccountId: m.business_account_id,
          code: m.code,
        })));
      }

      // Load business accounts for manual selection
      const accounts = await getBusinessAccountIsActiveTrue();
      setBusinessAccounts(accounts.map(a => ({ id: a.id, name: a.name, bank: a.bank })));
    };
    
    loadFilteredPaymentMethods();
  }, [POSSessionHook.session?.businessAccountId]);

  const loadProducts = async (
    page: number,
    search: string,
    stockTypeId?: number,
    warehouseId?: number
  ) => {
    if (!warehouseId) return;

    try {
      setProductsLoading(true);
      const result = await fetchSaleProducts({
        page,
        size: 10,
        search: search || undefined,
        stockTypeId,
        warehouseId,
      });
      setPaginatedProducts(result.data || []);
      setProductPagination(result.page);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // =============================================
  // STEP NAVIGATION
  // =============================================

  const canProceedToStep = useCallback(
    (step: POSStep): boolean => {
      switch (step) {
        case 2: // Need configuration
          return !!configuration?.priceListId && !!configuration?.warehouseId;
        case 3: // Need products in cart
          return cart.length > 0;
        case 4: // Need customer data (or anonymous purchase)
          return (
            isAnonymousPurchase || (
              !!customer.documentTypeId &&
              !!customer.documentNumber &&
              !!customer.customerName
            )
          );
        case 5: // If requires shipping, need shipping data
          if (customer.requiresShipping) {
            return (
              !!shipping.shippingMethodId &&
              !!shipping.countryId &&
              !!shipping.stateId &&
              !!shipping.cityId &&
              !!shipping.address
            );
          }
          return true;
        default:
          return true;
      }
    },
    [configuration, cart, customer, shipping, isAnonymousPurchase]
  );

  const nextStep = useCallback(() => {
    if (currentStep < 5 && canProceedToStep((currentStep + 1) as POSStep)) {
      // Skip shipping step if not required
      if (currentStep === 3 && !customer.requiresShipping) {
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => (prev + 1) as POSStep);
      }
    }
  }, [currentStep, canProceedToStep, customer.requiresShipping]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      // Skip shipping step going back if not required
      if (currentStep === 5 && !customer.requiresShipping) {
        setCurrentStep(3);
      } else {
        setCurrentStep((prev) => (prev - 1) as POSStep);
      }
    }
  }, [currentStep, customer.requiresShipping]);

  const goToStep = useCallback(
    (step: POSStep) => {
      if (step <= currentStep || canProceedToStep(step)) {
        // Handle shipping step skip
        if (step === 4 && !customer.requiresShipping) {
          return; // Can't go to shipping if not required
        }
        setCurrentStep(step);
      }
    },
    [currentStep, canProceedToStep, customer.requiresShipping]
  );

  // =============================================
  // CONFIGURATION (STEP 1)
  // =============================================

  const confirmConfiguration = useCallback(
    (priceListId: string) => {
      if (!userWarehouseId || !userWarehouseName) {
        toast({
          title: "Error",
          description: "No tiene un almacen asignado",
          variant: "destructive",
        });
        return;
      }
      setConfiguration({
        priceListId,
        warehouseId: userWarehouseId,
        warehouseName: userWarehouseName,
      });

      // Load products with configuration
      loadProducts(
        1,
        "",
        selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
        userWarehouseId
      );

      setCurrentStep(2);
    },
    [userWarehouseId, userWarehouseName, selectedStockTypeId, toast]
  );

  // =============================================
  // CART MANAGEMENT (STEP 2)
  // =============================================

  const addToCart = useCallback(
    (product: PaginatedProductVariation): boolean => {
      if (!selectedStockTypeId || !configuration) {
        return false;
      }

      // Check if already in cart
      const existingIndex = cart.findIndex(
        (item) =>
          item.variationId === product.variationId &&
          item.stockTypeId === parseInt(selectedStockTypeId)
      );

      if (existingIndex !== -1) {
        // Increment quantity instead
        setCart((prev) => {
          const updated = [...prev];
          const item = updated[existingIndex];
          if (item.quantity < item.maxStock) {
            updated[existingIndex] = { ...item, quantity: item.quantity + 1 };
          }
          return updated;
        });
        return true;
      }

      // Validate stock
      if ((product.stock || 0) <= 0) {
        toast({
          title: "Sin stock",
          description: "Este producto no tiene stock disponible",
          variant: "destructive",
        });
        return false;
      }

      // Get price from selected price list
      const priceListId = parseInt(configuration.priceListId);
      const priceEntry = product.prices.find(
        (p) => p.price_list_id === priceListId
      );
      const price = priceEntry?.sale_price || priceEntry?.price || 0;

      const newItem: POSCartItem = {
        variationId: product.variationId,
        productName: product.productTitle,
        variationName:
          product.terms.map((t) => t.name).join(" / ") || product.sku,
        sku: product.sku,
        quantity: 1,
        price,
        originalPrice: price,
        discountAmount: 0,
        stockTypeId: parseInt(selectedStockTypeId),
        stockTypeName:
          formData?.stockTypes?.find(
            (st) => st.id === parseInt(selectedStockTypeId)
          )?.name || "",
        maxStock: product.stock || 0,
        imageUrl: product.imageUrl || null,
      };

      setCart((prev) => [...prev, newItem]);
      return true;
    },
    [selectedStockTypeId, configuration, cart, formData, toast]
  );

  const updateCartItem = useCallback(
    (index: number, field: keyof POSCartItem, value: number | string) => {
      setCart((prev) => {
        const updated = [...prev];
        const item = updated[index];

        if (field === "quantity") {
          updated[index] = {
            ...item,
            quantity: Math.min(Math.max(1, value as number), item.maxStock),
          };
        } else if (field === "discountAmount") {
          updated[index] = { ...item, discountAmount: value as number };
        }

        return updated;
      });
    },
    []
  );

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // =============================================
  // CUSTOMER (STEP 3)
  // =============================================

  const updateCustomer = useCallback(
    (field: keyof POSCustomerData, value: string | boolean) => {
      setCustomer((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const searchClient = useCallback(async () => {
    if (!customer.documentTypeId || !customer.documentNumber) return;

    setSearchingClient(true);
    setClientFound(null);

    try {
      // First check in accounts table
      const data = await searchClientByDocument(
        parseInt(customer.documentTypeId),
        customer.documentNumber
      );
      const client = adaptClientSearchResult(data);

      if (client) {
        setClientFound(true);
        setCustomer((prev) => ({
          ...prev,
          customerName: client.name,
          customerLastname: client.lastName,
          customerLastname2: client.lastName2 || "",
          email: client.email || "",
          phone: client.phone || "",
          isExistingClient: true,
        }));
        return;
      }

      // Try external lookup for DNI/RUC
      const docType = formData?.documentTypes.find(
        (dt) => dt.id.toString() === customer.documentTypeId
      );

      if (docType?.code === "DNI" || docType?.code === "RUC") {
        const lookupResult = await lookupDocument(
          docType.code,
          customer.documentNumber
        );

        if (lookupResult?.found) {
          setClientFound(true);
          setCustomer((prev) => ({
            ...prev,
            customerName:
              docType.code === "RUC"
                ? lookupResult.razonSocial || ""
                : lookupResult.nombres || "",
            customerLastname:
              docType.code === "RUC"
                ? ""
                : lookupResult.apellidoPaterno || "",
            customerLastname2:
              docType.code === "RUC"
                ? ""
                : lookupResult.apellidoMaterno || "",
            isExistingClient: false,
          }));
          return;
        }
      }

      setClientFound(false);
    } catch (error) {
      console.error("Error searching client:", error);
      setClientFound(false);
    } finally {
      setSearchingClient(false);
    }
  }, [customer.documentTypeId, customer.documentNumber, formData]);

  // =============================================
  // ANONYMOUS PURCHASE
  // =============================================

  const handleAnonymousPurchase = useCallback(async () => {
    let anonymousName = "No especificado";
    try {
      const { data: anonAccount } = await supabase
        .from("accounts")
        .select("name, middle_name, last_name, last_name2")
        .eq("document_type_id", 0)
        .eq("document_number", " ")
        .single();
      if (anonAccount) {
        anonymousName = [anonAccount.name, anonAccount.middle_name, anonAccount.last_name, anonAccount.last_name2].filter(Boolean).join(" ");
      }
    } catch (e) {
      console.error("Error fetching anonymous account:", e);
    }

    setCustomer((prev) => ({
      ...prev,
      documentTypeId: "",
      documentNumber: "",
      customerName: anonymousName,
      customerLastname: "",
      customerLastname2: "",
      isExistingClient: true,
    }));
    setIsAnonymousPurchase(true);
    setClientFound(false);

    // Advance to next step (skip shipping if not required)
    if (!customer.requiresShipping) {
      setCurrentStep(5);
    } else {
      setCurrentStep(4);
    }
  }, [customer.requiresShipping]);

  // =============================================
  // SHIPPING (STEP 4)
  // =============================================

  const updateShipping = useCallback(
    (field: keyof POSShippingData, value: string | number) => {
      setShipping((prev) => {
        const updated = { ...prev, [field]: value };

        // Reset child fields when parent changes
        if (field === "countryId") {
          updated.stateId = "";
          updated.cityId = "";
          updated.neighborhoodId = "";
          updated.shippingMethodId = "";
          updated.shippingCost = 0;
        }
        if (field === "stateId") {
          updated.cityId = "";
          updated.neighborhoodId = "";
          updated.shippingMethodId = "";
          updated.shippingCost = 0;
        }
        if (field === "cityId") {
          updated.neighborhoodId = "";
          updated.shippingMethodId = "";
          updated.shippingCost = 0;
        }
        if (field === "neighborhoodId") {
          updated.shippingMethodId = "";
          updated.shippingCost = 0;
        }

        return updated;
      });
    },
    []
  );

  // Computed shipping costs based on selected location
  const availableShippingCosts = useMemo(() => {
    if (
      !shipping.countryId ||
      !shipping.stateId ||
      !shipping.cityId ||
      !shipping.neighborhoodId
    ) {
      return [];
    }
    return filterShippingCostsByLocation(
      allShippingCosts,
      Number(shipping.countryId),
      Number(shipping.stateId),
      Number(shipping.cityId),
      Number(shipping.neighborhoodId)
    );
  }, [allShippingCosts, shipping]);

  // =============================================
  // PAYMENTS (STEP 5)
  // =============================================

  const addPayment = useCallback(() => {
    if (!currentPayment.paymentMethodId || currentPayment.amount <= 0) {
      toast({
        title: "Error",
        description: "Seleccione metodo de pago y monto",
        variant: "destructive",
      });
      return;
    }

    // Find the selected method in filtered payment methods (POS-specific)
    const selectedMethod = filteredPaymentMethods.find(
      (pm) => pm.id.toString() === currentPayment.paymentMethodId
    );

    // Determine businessAccountId based on 3 rules
    let finalBusinessAccountId: string | undefined;

    if (selectedMethod) {
      const methodBaId = selectedMethod.businessAccountId;
      if (selectedMethod.code === "CASH") {
        // Rule 3: Cash → use session's business account
        finalBusinessAccountId = POSSessionHook.session?.businessAccountId?.toString();
      } else if (methodBaId && methodBaId !== 0) {
        // Rule 1: Has a linked account → use it
        finalBusinessAccountId = methodBaId.toString();
      } else {
        // Rule 2: No linked account, not cash → user must select manually
        if (!currentPayment.businessAccountId) {
          toast({
            title: "Error",
            description: "Seleccione una cuenta de destino",
            variant: "destructive",
          });
          return;
        }
        finalBusinessAccountId = currentPayment.businessAccountId;
      }
    }

    setPayments((prev) => [
      ...prev,
      {
        ...currentPayment,
        id: crypto.randomUUID(),
        paymentMethodName: selectedMethod?.name,
        businessAccountId: finalBusinessAccountId,
      },
    ]);
    setCurrentPayment({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
  }, [currentPayment, filteredPaymentMethods, POSSessionHook.session, toast]);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateCurrentPayment = useCallback(
    (field: keyof POSPayment, value: string | number) => {
      setCurrentPayment((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // =============================================
  // COMPUTED VALUES (before change entries so changeAmount is available)
  // =============================================

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const itemDiscounts = cart.reduce(
      (sum, item) => sum + item.discountAmount * item.quantity,
      0
    );
    return itemDiscounts + generalDiscount;
  }, [cart, generalDiscount]);

  const shippingCostValue = customer.requiresShipping ? shipping.shippingCost : 0;

  const total = useMemo(() => {
    return subtotal - discountAmount + shippingCostValue;
  }, [subtotal, discountAmount, shippingCostValue]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const changeAmount = useMemo(() => {
    return Math.max(0, totalPaid - total);
  }, [totalPaid, total]);

  const canFinalize = useMemo(() => {
    return (
      totalPaid >= total && cart.length > 0 && POSSessionHook.hasActiveSession
    );
  }, [totalPaid, total, cart, POSSessionHook.hasActiveSession]);

  // =============================================
  // CHANGE ENTRIES (VUELTO)
  // =============================================

  const addChangeEntry = useCallback(() => {
    if (!currentChangeEntry.paymentMethodId || currentChangeEntry.amount <= 0) {
      toast({
        title: "Error",
        description: "Seleccione método de pago y monto para el vuelto",
        variant: "destructive",
      });
      return;
    }

    // Determine businessAccountId using same 3 rules as payments
    const selectedMethod = filteredPaymentMethods.find(
      (pm) => pm.id.toString() === currentChangeEntry.paymentMethodId
    );

    let finalBusinessAccountId: string | undefined;
    if (selectedMethod) {
      const methodBaId = selectedMethod.businessAccountId;
      if (selectedMethod.code === "CASH") {
        finalBusinessAccountId = POSSessionHook.session?.businessAccountId?.toString();
      } else if (methodBaId && methodBaId !== 0) {
        finalBusinessAccountId = methodBaId.toString();
      } else {
        if (!currentChangeEntry.businessAccountId) {
          toast({
            title: "Error",
            description: "Seleccione una cuenta de origen para el vuelto",
            variant: "destructive",
          });
          return;
        }
        finalBusinessAccountId = currentChangeEntry.businessAccountId;
      }
    }

    // Validate total change entries don't exceed calculated change
    const existingChangeTotal = changeEntries.reduce(
      (acc, entry) => acc + entry.amount, 0
    );
    if (existingChangeTotal + currentChangeEntry.amount > changeAmount) {
      toast({
        title: "Monto excedido",
        description: "El vuelto total no puede superar el vuelto calculado",
        variant: "destructive",
      });
      return;
    }

    setChangeEntries((prev) => [
      ...prev,
      {
        ...currentChangeEntry,
        id: crypto.randomUUID(),
        paymentMethodName: selectedMethod?.name,
        businessAccountId: finalBusinessAccountId,
      },
    ]);
    setCurrentChangeEntry({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
  }, [currentChangeEntry, filteredPaymentMethods, POSSessionHook.session, changeEntries, changeAmount, toast]);

  const removeChangeEntry = useCallback((id: string) => {
    setChangeEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateCurrentChangeEntry = useCallback(
    (field: keyof POSPayment, value: string | number) => {
      setCurrentChangeEntry((prev) => ({ ...prev, [field]: value }));
    },
    []
  );


  // =============================================
  // SUBMIT ORDER
  // =============================================

  const submitOrder = useCallback(async () => {
    if (!canFinalize || !configuration || !POSSessionHook.session) {
      toast({
        title: "Error",
        description: "No se puede finalizar la venta",
        variant: "destructive",
      });
      return null;
    }

    setSaving(true);
    try {
      // Get "Completado" or first available situation
      // POS orders are always created with "Entregado" situation (id: 20)
      const situationId = 20;

      // Get "Tienda Física" sale type or first available
      const tiendaFisicaType = formData?.saleTypes.find(
        (st) =>
          st.name.toLowerCase().includes("tienda") ||
          st.name.toLowerCase().includes("fisica")
      );
      const saleTypeId =
        tiendaFisicaType?.id?.toString() ||
        formData?.saleTypes[0]?.id?.toString() ||
        "1";

      const orderData: CreatePOSOrderRequest = {
        priceListId: configuration.priceListId,
        documentType: isAnonymousPurchase ? "0" : customer.documentTypeId,
        documentNumber: isAnonymousPurchase ? " " : customer.documentNumber,
        customerName: customer.customerName,
        customerLastname: isAnonymousPurchase ? null : customer.customerLastname,
        customerLastname2: isAnonymousPurchase ? null : (customer.customerLastname2 || null),
        email: customer.email || null,
        phone: customer.phone || null,
        isExistingClient: isAnonymousPurchase ? true : customer.isExistingClient,
        withShipping: customer.requiresShipping,
        shippingMethod: customer.requiresShipping
          ? shipping.shippingMethodId
          : null,
        shippingCost: customer.requiresShipping ? shipping.shippingCost : null,
        countryId: customer.requiresShipping ? shipping.countryId : null,
        stateId: customer.requiresShipping ? shipping.stateId : null,
        cityId: customer.requiresShipping ? shipping.cityId : null,
        neighborhoodId: customer.requiresShipping
          ? shipping.neighborhoodId
          : null,
        address: customer.requiresShipping ? shipping.address : null,
        addressReference: customer.requiresShipping
          ? shipping.addressReference
          : null,
        receptionPerson: customer.requiresShipping
          ? shipping.receptionPerson
          : null,
        receptionPhone: customer.requiresShipping
          ? shipping.receptionPhone
          : null,
        products: cart.map((item) => ({
          variationId: item.variationId,
          quantity: item.quantity,
          price: item.price,
          discountAmount: item.discountAmount,
          stockTypeId: item.stockTypeId,
        })),
        payments: payments.map((p) => ({
          paymentMethodId: parseInt(p.paymentMethodId),
          amount: p.amount,
          confirmationCode: p.confirmationCode || null,
          businessAccountId: p.businessAccountId ? parseInt(p.businessAccountId) : null,
        })),
        changeEntries: changeEntries.map((e) => ({
          paymentMethodId: parseInt(e.paymentMethodId),
          amount: e.amount,
          businessAccountId: e.businessAccountId ? parseInt(e.businessAccountId) : null,
        })),
        subtotal,
        discount: discountAmount,
        total,
        change: changeAmount,
        initialSituationId: situationId,
        saleType: saleTypeId,
      };

      const result = await createPOSOrder(orderData);

      // Vincular orden con sesión POS
      if (result.order?.id && POSSessionHook.session?.id) {
        const { error: linkError } = await supabase
          .from("pos_session_orders")
          .insert({
            pos_session_id: POSSessionHook.session.id,
            order_id: result.order.id,
          });
        
        if (linkError) {
          console.error("Error linking order to POS session:", linkError);
        }
      }

      toast({
        title: "Venta completada",
        description: `Pedido #${result.order.id} creado exitosamente`,
      });

      // Reset for new sale
      resetForNewSale();

      return result;
    } catch (error: unknown) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "No se pudo crear la venta";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [
    canFinalize,
    configuration,
    POSSessionHook.session,
    customer,
    shipping,
    cart,
    payments,
    changeEntries,
    changeAmount,
    subtotal,
    discountAmount,
    total,
    formData,
    toast,
  ]);

  const resetForNewSale = useCallback(() => {
    setCurrentStep(2); // Go back to products step
    setCart([]);
    setGeneralDiscount(0);
    setCustomer(DEFAULT_CUSTOMER);
    setShipping(DEFAULT_SHIPPING);
    setPayments([]);
    setChangeEntries([]);
    setClientFound(null);
    setIsAnonymousPurchase(false);
    setSearchQuery("");
    setCurrentPayment({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
    setCurrentChangeEntry({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
  }, []);

  const resetAll = useCallback(() => {
    setCurrentStep(1);
    setConfiguration(null);
    setCart([]);
    setGeneralDiscount(0);
    setCustomer(DEFAULT_CUSTOMER);
    setShipping(DEFAULT_SHIPPING);
    setPayments([]);
    setChangeEntries([]);
    setClientFound(null);
    setIsAnonymousPurchase(false);
    setSearchQuery("");
    setCurrentPayment({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
    setCurrentChangeEntry({
      id: crypto.randomUUID(),
      paymentMethodId: "",
      amount: 0,
      confirmationCode: "",
    });
  }, []);

  // State for close session modal
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [sessionTotalCashSales, setSessionTotalCashSales] = useState(0);
  const [sessionBusinessAccountTotal, setSessionBusinessAccountTotal] = useState(0);

  // Load session cash sales and business account total
  const loadSessionCloseData = useCallback(async () => {
    if (!POSSessionHook.session?.id) {
      setSessionTotalCashSales(0);
      setSessionBusinessAccountTotal(0);
      return;
    }

    try {
      // Load total_cash_sales and business_account from pos_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from("pos_sessions")
        .select("total_cash_sales, business_account")
        .eq("id", POSSessionHook.session.id)
        .single();

      if (sessionError) throw sessionError;

      const cashSales = sessionData?.total_cash_sales ?? 0;
      setSessionTotalCashSales(cashSales);

      // Load total_amount from business_accounts
      if (sessionData?.business_account) {
        const { data: baData, error: baError } = await supabase
          .from("business_accounts")
          .select("total_amount")
          .eq("id", sessionData.business_account)
          .single();

        if (baError) throw baError;
        setSessionBusinessAccountTotal(baData?.total_amount ?? 0);
      }
    } catch (error) {
      console.error("Error loading session close data:", error);
      setSessionTotalCashSales(0);
      setSessionBusinessAccountTotal(0);
    }
  }, [POSSessionHook.session?.id]);

  const exitPOS = useCallback(async () => {
    // Load session data and show close modal
    await loadSessionCloseData();
    setShowCloseSessionModal(true);
  }, [loadSessionCloseData]);

  const handleCloseSession = useCallback(async (request: { sessionId: number; closingAmount: number; notes?: string }) => {
    try {
      await POSSessionHook.closeSession(request);
      setShowCloseSessionModal(false);
      navigate("/pos");
    } catch {
      // Error is already handled in hook with toast
    }
  }, [POSSessionHook, navigate]);

  const cancelCloseSession = useCallback(() => {
    setShowCloseSessionModal(false);
  }, []);

  // =============================================
  // RETURN
  // =============================================

  return {
    // Step state
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    canProceedToStep,

    // Cash session (spread all properties)
    session: POSSessionHook.session,
    hasActiveSession: POSSessionHook.hasActiveSession,
    sessionLoading: POSSessionHook.loading,
    openSession: POSSessionHook.openSession,
    closeSession: POSSessionHook.closeSession,
    openingSession: POSSessionHook.opening,
    closingSession: POSSessionHook.closing,

    // Loading states
    loading,
    saving,
    searchingClient,
    productsLoading,

    // Configuration (Step 1)
    configuration,
    priceLists,
    userWarehouseId,
    userWarehouseName,
    confirmConfiguration,

    // Form data
    formData,

    // Products (Step 2)
    cart,
    paginatedProducts,
    productPage,
    productPagination,
    searchQuery,
    setSearchQuery,
    selectedStockTypeId,
    setSelectedStockTypeId,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    generalDiscount,
    setGeneralDiscount,
    handleProductPageChange: (page: number) => {
      setProductPage(page);
      if (configuration?.warehouseId) {
        loadProducts(
          page,
          searchQuery,
          selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
          configuration.warehouseId
        );
      }
    },

    // Customer (Step 3)
    customer,
    clientFound,
    updateCustomer,
    searchClient,
    isAnonymousPurchase,
    handleAnonymousPurchase,

    // Shipping (Step 4)
    shipping,
    availableShippingCosts,
    allShippingCosts,
    updateShipping,

    // Payments (Step 5)
    payments,
    currentPayment,
    filteredPaymentMethods,
    businessAccounts,
    addPayment,
    removePayment,
    updateCurrentPayment,

    // Change entries (vuelto)
    changeEntries,
    currentChangeEntry,
    addChangeEntry,
    removeChangeEntry,
    updateCurrentChangeEntry,

    // Computed
    subtotal,
    discountAmount,
    total,
    totalPaid,
    changeAmount,
    canFinalize,

    // Actions
    submitOrder,
    resetForNewSale,
    resetAll,
    exitPOS,
    
    // Close session modal
    showCloseSessionModal,
    sessionTotalCashSales,
    sessionBusinessAccountTotal,
    handleCloseSession,
    cancelCloseSession,
  };
};
