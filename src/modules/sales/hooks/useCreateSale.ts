// =============================================
// useCreateSale Hook
// Main logic for Create/Edit Sale page
// =============================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  SaleFormData,
  SaleProduct,
  SalePayment,
  SalesFormDataResponse,
  ShippingCost,
  ProductVariation,
  PriceList,
  LocalNote,
  PaginatedProductVariation,
  PaginationMeta,
  OrdersSituationsById,
} from "../types";
import {
  adaptSalesFormData,
  adaptShippingCosts,
  adaptClientSearchResult,
  adaptPriceLists,
  getIdInventoryTypeAdapter,
  getOrdersSituationsByIdAdapter,
  adaptSaleById,
} from "../adapters";
import {
  fetchSalesFormData,
  fetchShippingCosts,
  searchClientByDocument,
  lookupDocument,
  createOrder,
  updateOrder,
  updateOrderSituation,
  fetchPriceLists,
  fetchSaleProducts,
  uploadPaymentVoucher,
  updatePaymentVoucherUrl,
  getIdInventoryTypeApi,
  getOrdersSituationsById,
  fetchSaleById,
} from "../services";
import {
  calculateSubtotal,
  calculateDiscountAmount,
  calculateTotal,
  filterShippingCostsByLocation,
  getTodayDate,
} from "../utils";

const INITIAL_FORM_DATA: SaleFormData = {
  documentType: "",
  documentNumber: "",
  customerName: "",
  customerLastname: "",
  customerLastname2: "",
  email: "",
  phone: "",
  saleType: "",
  priceListId: "",
  saleDate: getTodayDate(),
  vendorName: "",
  shippingMethod: "",
  shippingCost: "",
  countryId: "",
  stateId: "",
  cityId: "",
  neighborhoodId: "",
  address: "",
  addressReference: "",
  receptionPerson: "",
  receptionPhone: "",
  withShipping: false,
  employeeSale: false,
  notes: "",
};

const createEmptyPayment = (): SalePayment => ({
  id: crypto.randomUUID(),
  paymentMethodId: "",
  amount: "",
  confirmationCode: "",
  voucherUrl: "",
  voucherFile: undefined,
  voucherPreview: undefined,
});

export const useCreateSale = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const { toast } = useToast();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [priceListsLoading, setPriceListsLoading] = useState(true);
  const [loadingWarehouse, setLoadingWarehouse] = useState(true);

  // Price list modal state
  const [showPriceListModal, setShowPriceListModal] = useState(true);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);

  // User warehouse state
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);
  const [userWarehouseName, setUserWarehouseName] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState<SaleFormData>(INITIAL_FORM_DATA);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [payments, setPayments] = useState<SalePayment[]>([
    createEmptyPayment(),
  ]);
  const [currentPayment, setCurrentPayment] =
    useState<SalePayment>(createEmptyPayment());
  const [orderSituation, setOrderSituation] = useState<string>("");
  const [currentStatusCode, setCurrentStatusCode] = useState<string>("");

  // Dropdown data
  const [salesData, setSalesData] = useState<SalesFormDataResponse | null>(
    null,
  );
  const [allShippingCosts, setAllShippingCosts] = useState<ShippingCost[]>([]);

  // UI state
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [isExistingClient, setIsExistingClient] = useState<boolean>(false); // true only if found in accounts table
  const [isAnonymousPurchase, setIsAnonymousPurchase] = useState(false);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStockTypeId, setSelectedStockTypeId] = useState<string>("");

  // Server-side product pagination state
  const [paginatedProducts, setPaginatedProducts] = useState<
    PaginatedProductVariation[]
  >([]);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState<PaginationMeta>({
    page: 1,
    size: 10,
    total: 0,
  });
  const [productsLoading, setProductsLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notes state (chat-style)
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteImageFile, setNoteImageFile] = useState<File | null>(null);
  const [noteImagePreview, setNoteImagePreview] = useState<string | null>(null);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number>(null);
  const [orderSituationTable, setOrderSituationTable] = useState<
    OrdersSituationsById[]
  >([]);

  // Load initial form data and user warehouse
  useEffect(() => {
    loadFormData();
    loadUserWarehouse();
  }, []);

  // Load price lists on mount
  useEffect(() => {
    loadPriceLists();
  }, []);

  // Load order data when editing (skip modal if editing)
  useEffect(() => {
    if (orderId && salesData) {
      loadOrderData(parseInt(orderId));
      setShowPriceListModal(false); // Don't show modal when editing
    }
  }, [orderId, salesData]);

  // Load shipping costs when location changes
  useEffect(() => {
    if (formData.withShipping) {
      loadShippingCosts();
    }
  }, [formData.withShipping]);

  // Debounced search effect - also re-load when stockTypeId or warehouseId changes
  useEffect(() => {
    // Don't load products until we have the warehouse ID
    if (!userWarehouseId) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setProductPage(1);
      loadProducts(
        1,
        searchQuery,
        selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
        userWarehouseId,
      );
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, selectedStockTypeId, userWarehouseId]);

  useEffect(() => {
    const load = async () => {
      if (createdOrderId) {
        const data = await getOrdersSituationsById(createdOrderId);
        const history = getOrdersSituationsByIdAdapter(data);
        setOrderSituationTable(history);
      }
    };
    load();
  }, [createdOrderId]);

  // Computed: Available shipping costs based on selected location
  const availableShippingCosts = useMemo(() => {
    if (
      !formData.countryId ||
      !formData.stateId ||
      !formData.cityId ||
      !formData.neighborhoodId
    ) {
      return [];
    }
    return filterShippingCostsByLocation(
      allShippingCosts,
      Number(formData.countryId),
      Number(formData.stateId),
      Number(formData.cityId),
      Number(formData.neighborhoodId),
    );
  }, [
    allShippingCosts,
    formData.countryId,
    formData.stateId,
    formData.cityId,
    formData.neighborhoodId,
  ]);

  // Computed: Filtered variations from server-side paginated data (for dropdown display)
  const filteredVariations = useMemo(() => {
    return paginatedProducts.map((p) => ({
      id: p.variationId,
      sku: p.sku,
      productId: p.productId,
      productTitle: p.productTitle,
      imageUrl: p.imageUrl,
      stock: p.stock,
      terms: p.terms,
      prices: p.prices.map((pr) => ({
        priceListId: pr.price_list_id,
        price: pr.price,
        salePrice: pr.sale_price,
      })),
    }));
  }, [paginatedProducts]);

  // Computed: Filtered states by country
  const filteredStates = useMemo(() => {
    if (!salesData?.states || !formData.countryId) return [];
    return salesData.states.filter(
      (s) => s.countryId === Number(formData.countryId),
    );
  }, [salesData?.states, formData.countryId]);

  // Computed: Filtered cities by state
  const filteredCities = useMemo(() => {
    if (!salesData?.cities || !formData.stateId) return [];
    return salesData.cities.filter(
      (c) => c.stateId === Number(formData.stateId),
    );
  }, [salesData?.cities, formData.stateId]);

  // Computed: Filtered neighborhoods by city
  const filteredNeighborhoods = useMemo(() => {
    if (!salesData?.neighborhoods || !formData.cityId) return [];
    return salesData.neighborhoods.filter(
      (n) => n.cityId === Number(formData.cityId),
    );
  }, [salesData?.neighborhoods, formData.cityId]);

  // Computed: Totals
  const subtotal = useMemo(() => calculateSubtotal(products), [products]);
  const discountAmount = useMemo(
    () => calculateDiscountAmount(products),
    [products],
  );
  const shippingCostValue = formData.shippingCost
    ? parseFloat(formData.shippingCost)
    : 0;
  const total = useMemo(
    () => calculateTotal(products, shippingCostValue),
    [products, shippingCostValue],
  );

  // Computed: Check if selected document type is persona jurídica (company)
  const isPersonaJuridica = useMemo(() => {
    if (!formData.documentType || !salesData?.documentTypes) return false;
    const selectedDocType = salesData.documentTypes.find(
      (dt) => dt.id.toString() === formData.documentType,
    );
    return selectedDocType?.personType === 2;
  }, [formData.documentType, salesData?.documentTypes]);

  // Computed: Check if current situation has PHY code (physical - no edits allowed)
  const isPhySituation = useMemo(() => {
    if (!orderSituation || !salesData?.situations) return false;
    const currentSituation = salesData.situations.find(
      (s) => s.id.toString() === orderSituation,
    );
    return currentSituation?.code === "PHY";
  }, [orderSituation, salesData?.situations]);

  // Computed: Check if current status has COM code (completed - no payment edits allowed)
  const isComSituation = useMemo(() => {
    return currentStatusCode === "COM";
  }, [currentStatusCode]);

  // Computed: Filter situations to only show those with order >= current situation's order
  const filteredSituations = useMemo(() => {
    if (!salesData?.situations) return [];
    if (!orderSituation) return salesData.situations;
    
    const currentSituation = salesData.situations.find(
      (s) => s.id.toString() === orderSituation,
    );
    if (!currentSituation || currentSituation.order == null) return salesData.situations;
    
    return salesData.situations.filter(
      (s) => s.order != null && s.order >= currentSituation.order,
    );
  }, [orderSituation, salesData?.situations]);

  // Load form data from API
  const loadFormData = async () => {
    try {
      const data = await fetchSalesFormData();
      setSalesData(adaptSalesFormData(data));
      const dataTypeId = await getIdInventoryTypeApi();
      const tId = getIdInventoryTypeAdapter(dataTypeId);
      setSelectedStockTypeId(tId.toString());
    } catch (error) {
      console.error("Error loading form data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del formulario",
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if NOT editing (orderId will trigger loadOrderData)
      if (!orderId) {
        setLoading(false);
      }
    }
  };

  // Load shipping costs
  const loadShippingCosts = async () => {
    try {
      const data = await fetchShippingCosts();

      setAllShippingCosts(adaptShippingCosts(data || []));
    } catch (error) {
      console.error("Error loading shipping costs:", error);
    }
  };

  // Load products with server-side pagination
  const loadProducts = async (
    page: number,
    search: string,
    stockTypeId?: number,
    warehouseId?: number,
  ) => {
    try {
      setProductsLoading(true);
      const result = await fetchSaleProducts({
        page,
        size: 10,
        search: search || undefined,
        stockTypeId,
        warehouseId,
      });

      // Map response with default values for imageUrl and stock
      const mappedProducts = (result.data || []).map((p: any) => ({
        ...p,
        imageUrl: p.imageUrl ?? null,
        stock: p.stock ?? 0,
      }));
      setPaginatedProducts(mappedProducts);
      setProductPagination(result.page);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // Handle product page change
  const handleProductPageChange = useCallback(
    (newPage: number) => {
      setProductPage(newPage);
      loadProducts(
        newPage,
        searchQuery,
        selectedStockTypeId ? parseInt(selectedStockTypeId) : undefined,
        userWarehouseId || undefined,
      );
    },
    [searchQuery, selectedStockTypeId, userWarehouseId],
  );

  // Load price lists
  const loadPriceLists = async () => {
    try {
      setPriceListsLoading(true);
      const data = await fetchPriceLists();
      setPriceLists(adaptPriceLists(data || []));
    } catch (error) {
      console.error("Error loading price lists:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las listas de precios",
        variant: "destructive",
      });
    } finally {
      setPriceListsLoading(false);
    }
  };

  // Load user's assigned warehouse from profile
  const loadUserWarehouse = async () => {
    try {
      setLoadingWarehouse(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user logged in");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("warehouse_id, warehouses(id, name)")
        .eq("UID", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (profile?.warehouse_id) {
        setUserWarehouseId(profile.warehouse_id);
        // Handle the warehouses relation (could be an object or array)
        const warehouse = Array.isArray(profile.warehouses)
          ? profile.warehouses[0]
          : profile.warehouses;
        setUserWarehouseName(warehouse?.name || "");
      }
    } catch (error) {
      console.error("Error loading user warehouse:", error);
    } finally {
      setLoadingWarehouse(false);
    }
  };

  // Handle price list selection from modal
  const handleSelectPriceList = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, priceListId: id }));
    setShowPriceListModal(false);
  }, []);

  // Load order data for editing (using consolidated Edge Function)
  const loadOrderData = async (id: number) => {
    try {
      setLoading(true);
      
      // Single call to get all data
      const data = await fetchSaleById(id);
      const adapted = adaptSaleById(data);
      
      // Set all state at once
      setFormData(adapted.formData);
      setProducts(adapted.products);
      setPayments(
        adapted.payments.length > 0
          ? adapted.payments
          : [createEmptyPayment()]
      );
      setOrderSituation(adapted.currentSituation);
      setCurrentStatusCode(adapted.currentStatusCode || "");
      setClientFound(true);
      setCreatedOrderId(id);

      // Detect anonymous purchase: document_type = "0" and document_number = " "
      if (adapted.formData.documentType === "0" && adapted.formData.documentNumber === " ") {
        setIsAnonymousPurchase(true);
      }
      
    } catch (error) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la venta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = useCallback(
    (field: keyof SaleFormData, value: string | boolean) => {
      // Debug: Log when saleType changes
      if (field === "saleType") {
        console.log("[CreateSale] handleInputChange saleType:", value);
      }
      
      // When document type changes to persona jurídica, clear lastname fields
      if (field === "documentType" && typeof value === "string") {
        const selectedDocType = salesData?.documentTypes.find(
          (dt) => dt.id.toString() === value,
        );
        if (selectedDocType?.personType === 2) {
          // Persona jurídica: clear lastnames
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            customerLastname: "",
            customerLastname2: "",
          }));
          return;
        }
      }

      setFormData((prev) => ({ ...prev, [field]: value }));

      // When shipping method changes, update the cost
      if (field === "shippingMethod" && value) {
        const selectedCost = allShippingCosts.find(
          (sc) => sc.id.toString() === value,
        );
        if (selectedCost) {
          setFormData((prev) => ({
            ...prev,
            shippingCost: selectedCost.cost.toString(),
          }));
        }
      }

      // Reset child fields when parent location changes
      if (field === "countryId") {
        setFormData((prev) => ({
          ...prev,
          stateId: "",
          cityId: "",
          neighborhoodId: "",
        }));
      }
      if (field === "stateId") {
        setFormData((prev) => ({ ...prev, cityId: "", neighborhoodId: "" }));
      }
      if (field === "cityId") {
        setFormData((prev) => ({ ...prev, neighborhoodId: "" }));
      }
    },
    [allShippingCosts, salesData?.documentTypes],
  );

  // Handle anonymous purchase toggle
  const handleAnonymousToggle = useCallback((checked: boolean) => {
    setIsAnonymousPurchase(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        documentType: "",
        documentNumber: "",
        customerName: "",
        customerLastname: "",
        customerLastname2: "",
      }));
      setClientFound(false);
    }
  }, []);

  // Handle stock type change - clears selected variation to ensure consistency
  const handleStockTypeChange = useCallback((value: string) => {
    setSelectedStockTypeId(value);
    setSelectedVariation(null);
  }, []);

  // Handle current payment changes
  const handlePaymentChange = useCallback(
    (field: keyof SalePayment, value: string) => {
      setCurrentPayment((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Handle voucher file selection
  const handleVoucherSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentPayment((prev) => ({
        ...prev,
        voucherFile: file,
        voucherPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove selected voucher
  const removeVoucher = useCallback(() => {
    setCurrentPayment((prev) => ({
      ...prev,
      voucherFile: undefined,
      voucherPreview: undefined,
    }));
  }, []);

  // Add payment to list
  const addPayment = useCallback(() => {
    if (!currentPayment.paymentMethodId || !currentPayment.amount) {
      toast({
        title: "Error",
        description: "Seleccione método de pago y monto",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(currentPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto del pago debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }

    setPayments((prev) => [
      ...prev,
      { ...currentPayment, id: crypto.randomUUID() },
    ]);
    setCurrentPayment(createEmptyPayment());
  }, [currentPayment, toast]);

  // Remove payment from list
  const removePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  }, []);

  // Update payment in list
  const updatePaymentInList = useCallback(
    (paymentId: string, field: keyof SalePayment, value: string) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, [field]: value } : p)),
      );
    },
    [],
  );

  // Search client by document
  const handleSearchClient = useCallback(
    async (overrideDocumentType?: string) => {
      const docType = overrideDocumentType || formData.documentType;
      if (!docType || !formData.documentNumber) return;

      setSearchingClient(true);
      try {
        // First, search in accounts table
        const data = await searchClientByDocument(
          parseInt(docType),
          formData.documentNumber,
        );
        const client = adaptClientSearchResult(data);

        if (client) {
          // Client exists in database
          setClientFound(true);
          setIsExistingClient(true); // Found in accounts table
          setFormData((prev) => ({
            ...prev,
            customerName: client.name,
            customerLastname: client.lastName,
            customerLastname2: client.lastName2 || "",
          }));
        } else {
          setIsExistingClient(false); // Not in accounts table
          // Client not found - check document type code
          const selectedDocType = salesData?.documentTypes.find(
            (dt) => dt.id.toString() === docType,
          );
          const docTypeCode = selectedDocType?.code?.toUpperCase();

          if (docTypeCode === "DNI" || docTypeCode === "RUC") {
            // Query external API for DNI/RUC
            try {
              const lookupResult = await lookupDocument(
                docTypeCode,
                formData.documentNumber,
              );

              if (lookupResult?.found) {
                setClientFound(true); // Lock fields when data found from external API

                // Check if persona jurídica (RUC) - use razón social
                if (docTypeCode === "RUC") {
                  setFormData((prev) => ({
                    ...prev,
                    customerName:
                      lookupResult.razonSocial || lookupResult.nombres || "",
                    customerLastname: "",
                    customerLastname2: "",
                  }));
                } else {
                  // Persona natural (DNI) - use nombres y apellidos
                  setFormData((prev) => ({
                    ...prev,
                    customerName: lookupResult.nombres || "",
                    customerLastname: lookupResult.apellidoPaterno || "",
                    customerLastname2: lookupResult.apellidoMaterno || "",
                  }));
                }
                toast({
                  title: "Datos encontrados",
                  description:
                    docTypeCode === "RUC"
                      ? "Se encontraron datos de la empresa en SUNAT"
                      : "Se encontraron datos del documento en RENIEC",
                });
              } else {
                // DNI/RUC not found in external API
                setClientFound(false);
                setFormData((prev) => ({
                  ...prev,
                  customerName: "",
                  customerLastname: "",
                  customerLastname2: "",
                }));
                toast({
                  title: "Documento no encontrado",
                  description: "No se encontraron datos para este documento",
                  variant: "destructive",
                });
              }
            } catch (lookupError) {
              console.error("Error looking up document:", lookupError);
              // On API error, still allow manual input
              setClientFound(false);
              setFormData((prev) => ({
                ...prev,
                customerName: "",
                customerLastname: "",
                customerLastname2: "",
              }));
              toast({
                title: "Error de consulta",
                description:
                  "No se pudo consultar el documento. Ingrese los datos manualmente.",
                variant: "destructive",
              });
            }
          } else {
            // Other document types (Passport, etc.) - enable manual input
            setClientFound(false);
            setFormData((prev) => ({
              ...prev,
              customerName: "",
              customerLastname: "",
              customerLastname2: "",
            }));
          }
        }
      } catch (error) {
        console.error("Error searching client:", error);
        toast({
          title: "Error",
          description: "No se pudo buscar el cliente",
          variant: "destructive",
        });
      } finally {
        setSearchingClient(false);
      }
    },
    [
      formData.documentType,
      formData.documentNumber,
      salesData?.documentTypes,
      toast,
    ],
  );

  // Add product to list - returns info about whether product was added or already existed
  const addProduct = useCallback((): { added: boolean; existingIndex?: number } => {
    if (!selectedVariation) {
      toast({
        title: "Error",
        description: "Seleccione una variación",
        variant: "destructive",
      });
      return { added: false };
    }

    if (!selectedStockTypeId) {
      toast({
        title: "Error",
        description: "Seleccione un tipo de inventario",
        variant: "destructive",
      });
      return { added: false };
    }

    // Check if product with same variation AND same stock type already exists
    const existingIndex = products.findIndex(
      (p) =>
        p.variationId === selectedVariation.id &&
        p.stockTypeId === parseInt(selectedStockTypeId),
    );

    if (existingIndex !== -1) {
      // Product already exists with the same stock type
      toast({
        title: "Producto ya agregado",
        description:
          "Este producto ya está en la lista con el mismo tipo de inventario",
      });
      return { added: false, existingIndex };
    }

    // Validate stock is greater than 0
    const availableStock = selectedVariation.stock || 0;
    if (availableStock <= 0) {
      toast({
        title: "Sin stock",
        description:
          "Este producto no tiene stock disponible para el tipo de inventario seleccionado",
        variant: "destructive",
      });
      return { added: false };
    }

    // Find price for selected price list
    const priceListId = formData.priceListId
      ? parseInt(formData.priceListId)
      : null;
    const priceEntry = priceListId
      ? selectedVariation.prices.find((p) => p.priceListId === priceListId)
      : selectedVariation.prices[0];

    const price = priceEntry?.salePrice || priceEntry?.price || 0;
    const termsNames = selectedVariation.terms.map((t) => t.name).join(" / ");

    // Get stock type name
    const stockTypeName =
      salesData?.stockTypes?.find(
        (st) => st.id === parseInt(selectedStockTypeId),
      )?.name || "";

    setProducts((prev) => [
      ...prev,
      {
        variationId: selectedVariation.id,
        productName: selectedVariation.productTitle,
        variationName: termsNames || selectedVariation.sku,
        sku: selectedVariation.sku,
        quantity: 1,
        price,
        discountAmount: 0,
        stockTypeId: parseInt(selectedStockTypeId),
        stockTypeName,
        maxStock: availableStock,
      },
    ]);

    setSearchQuery("");
    setSelectedVariation(null);
    return { added: true };
  }, [selectedVariation, formData.priceListId, selectedStockTypeId, products, salesData?.stockTypes, toast]);

  // Remove product from list
  const removeProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Update product in list
  const updateProduct = useCallback(
    (index: number, field: keyof SaleProduct, value: any) => {
      setProducts((prev) => {
        const updated = [...prev];
        const product = updated[index];

        // For quantity, allow 0 temporarily (for editing), but clamp to maxStock
        if (field === "quantity") {
          const newQuantity = Math.min(Math.max(0, value), product.maxStock);
          updated[index] = { ...product, quantity: newQuantity };
        } else {
          updated[index] = { ...product, [field]: value };
        }

        return updated;
      });
    },
    [],
  );

  // Add a note to the list (chat-style)
  const addNote = useCallback(() => {
    if (!newNoteText.trim() && !noteImageFile) {
      return;
    }

    const newNote: LocalNote = {
      id: crypto.randomUUID(),
      message: newNoteText.trim(),
      imageFile: noteImageFile || undefined,
      imagePreview: noteImagePreview || undefined,
      createdAt: new Date(),
      userName: "Usuario", // TODO: Get from auth context
    };

    setNotes((prev) => [...prev, newNote]);
    setNewNoteText("");
    setNoteImageFile(null);
    setNoteImagePreview(null);
  }, [newNoteText, noteImageFile, noteImagePreview]);

  // Remove a note from the list
  const removeNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  // Handle note image selection
  const handleNoteImageSelect = useCallback((file: File) => {
    setNoteImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNoteImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove selected note image
  const removeNoteImage = useCallback(() => {
    setNoteImageFile(null);
    setNoteImagePreview(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (products.length === 0) {
        toast({
          title: "Error",
          description: "Agregue al menos un producto",
          variant: "destructive",
        });
        return;
      }

      if (!orderSituation) {
        toast({
          title: "Error",
          description: "Seleccione un estado para el pedido",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      // Debug: Log saleType value being sent
      console.log("[CreateSale] Submitting with saleType:", formData.saleType);

      try {
        const orderData = {
          documentType: isAnonymousPurchase ? "0" : formData.documentType,
          documentNumber: isAnonymousPurchase ? " " : formData.documentNumber,
          customerName: isAnonymousPurchase ? null : formData.customerName,
          customerLastname: isAnonymousPurchase ? null : formData.customerLastname,
          customerLastname2: isAnonymousPurchase ? null : (formData.customerLastname2 || null),
          email: formData.email || null,
          phone: formData.phone || null,
          saleType: formData.saleType,
          priceListId: formData.priceListId || null,
          shippingMethod: formData.shippingMethod || null,
          shippingCost: formData.shippingCost
            ? parseFloat(formData.shippingCost)
            : null,
          countryId: formData.countryId || null,
          stateId: formData.stateId || null,
          cityId: formData.cityId || null,
          neighborhoodId: formData.neighborhoodId || null,
          address: formData.address || null,
          addressReference: formData.addressReference || null,
          receptionPerson: formData.receptionPerson || null,
          receptionPhone: formData.receptionPhone || null,
          withShipping: formData.withShipping,
          employeeSale: formData.employeeSale,
          notes: formData.notes || null,
          subtotal,
          discount: discountAmount,
          total,
          isExistingClient, // true if client was found in accounts table
          products: products.map((p) => ({
            variationId: p.variationId,
            quantity: p.quantity,
            price: p.price,
            discountAmount: p.discountAmount,
            stockTypeId: p.stockTypeId,
          })),
          payments: payments
            .filter((p) => p.paymentMethodId && p.amount)
            .map((p) => ({
              paymentMethodId: parseInt(p.paymentMethodId),
              amount: parseFloat(p.amount) || 0,
              date: new Date().toISOString(),
              confirmationCode: p.confirmationCode || null,
              voucherUrl: p.voucherUrl || null,
            })),
          initialSituationId: parseInt(orderSituation),
        };

        let createdOrderId = orderId ? parseInt(orderId) : null;
        let createdPayments: Array<{ id: number; localIndex: number }> = [];

        if (orderId) {
          await updateOrder(parseInt(orderId), orderData);
        } else {
          const response = await createOrder(orderData);
          
          if (response?.order?.id) {
            createdOrderId = response.order.id;
            setCreatedOrderId(createdOrderId);
          }
          if (response?.payments) {
            createdPayments = response.payments;
          }
        }

        // Upload vouchers to storage after order is created
        if (createdOrderId && createdPayments.length > 0) {
          // Get the filtered payments that were actually sent to the API
          const validPayments = payments.filter(
            (p) => p.paymentMethodId && p.amount,
          );
          
          for (let i = 0; i < validPayments.length; i++) {
            const payment = validPayments[i];
            
            // Skip if no voucher file
            if (!payment.voucherFile) continue;
            
            // Find the corresponding created payment by localIndex (which matches the filtered array index)
            const createdPayment = createdPayments.find(
              (cp) => cp.localIndex === i,
            );

            if (createdPayment && payment.voucherFile) {
              try {
                const voucherUrl = await uploadPaymentVoucher(
                  createdOrderId,
                  createdPayment.id,
                  payment.voucherFile,
                );
                await updatePaymentVoucherUrl(createdPayment.id, voucherUrl);
              } catch (voucherError) {
                console.error("Error uploading voucher:", voucherError);
                // Continue with other vouchers even if one fails
              }
            }
          }
        }

        // Update order situation - only in edit mode (creation handles it in sp_create_order)
        if (orderId && orderSituation && createdOrderId) {
          await updateOrderSituation(createdOrderId, parseInt(orderSituation));
        }

        toast({
          title: "Éxito",
          description: orderId
            ? "Venta actualizada correctamente"
            : "Venta creada correctamente",
        });

        navigate("/sales");
      } catch (error) {
        console.error("Error saving sale:", error);
        toast({
          title: "Error",
          description: orderId
            ? "No se pudo actualizar la venta"
            : "No se pudo crear la venta",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [
      formData,
      products,
      payments,
      orderSituation,
      orderId,
      subtotal,
      discountAmount,
      total,
      isExistingClient,
      isAnonymousPurchase,
      toast,
      navigate,
    ],
  );

  return {
    // State
    loading,
    saving,
    searchingClient,
    formData,
    products,
    payments,
    currentPayment,
    orderSituation,
    salesData,
    clientFound,
    selectedVariation,
    searchQuery,
    selectedStockTypeId,

    // Server-side pagination state
    productPage,
    productPagination,
    productsLoading,

    // Notes state (chat-style)
    notes,
    newNoteText,
    noteImagePreview,

    // Price list modal
    showPriceListModal,
    priceLists,
    priceListsLoading,

    // User warehouse
    userWarehouseId,
    userWarehouseName,
    loadingWarehouse,

    // Computed
    availableShippingCosts,
    filteredVariations,
    filteredStates,
    filteredCities,
    filteredNeighborhoods,
    subtotal,
    discountAmount,
    total,
    orderId,
    isPersonaJuridica,
    isPhySituation,
    isComSituation,
    filteredSituations,
    isAnonymousPurchase,

    // Actions
    setOrderSituation,
    setSelectedVariation,
    setSearchQuery,
    handleStockTypeChange,
    handleInputChange,
    handlePaymentChange,
    addPayment,
    removePayment,
    updatePaymentInList,
    handleSearchClient,
    handleSelectPriceList,
    handleProductPageChange,
    handleAnonymousToggle,
    addProduct,
    removeProduct,
    updateProduct,
    handleSubmit,
    navigate,

    // Notes actions
    setNewNoteText,
    addNote,
    removeNote,
    handleNoteImageSelect,
    removeNoteImage,

    // Voucher actions
    handleVoucherSelect,
    removeVoucher,
    historyModalOpen,
    createdOrderId,
    orderSituationTable,
    setHistoryModalOpen,
  };
};
