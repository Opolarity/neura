// =============================================
// useCreateSale Hook
// Main logic for Create/Edit Sale page
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type {
  SaleFormData,
  SaleProduct,
  SalePayment,
  SalesFormDataResponse,
  ShippingCost,
  ProductVariation,
  PriceList,
  LocalNote,
} from '../types';
import {
  adaptSalesFormData,
  adaptShippingCosts,
  adaptClientSearchResult,
  adaptPriceLists,
} from '../adapters';
import {
  fetchSalesFormData,
  fetchShippingCosts,
  searchClientByDocument,
  lookupDocument,
  createOrder,
  updateOrder,
  updateOrderSituation,
  fetchOrderById,
  fetchOrderPayment,
  fetchOrderSituation,
  fetchVariationsByIds,
  fetchProductsByIds,
  fetchVariationTerms,
  fetchTermsByIds,
  fetchPriceLists,
} from '../services';
import {
  calculateSubtotal,
  calculateDiscountAmount,
  calculateTotal,
  filterShippingCostsByLocation,
  getTodayDate,
} from '../utils';

const INITIAL_FORM_DATA: SaleFormData = {
  documentType: '',
  documentNumber: '',
  customerName: '',
  customerLastname: '',
  customerLastname2: '',
  email: '',
  phone: '',
  saleType: '',
  priceListId: '',
  saleDate: getTodayDate(),
  vendorName: '',
  shippingMethod: '',
  shippingCost: '',
  countryId: '',
  stateId: '',
  cityId: '',
  neighborhoodId: '',
  address: '',
  addressReference: '',
  receptionPerson: '',
  receptionPhone: '',
  withShipping: false,
  employeeSale: false,
  notes: '',
};

const createEmptyPayment = (): SalePayment => ({
  id: crypto.randomUUID(),
  paymentMethodId: '',
  amount: '',
  confirmationCode: '',
  voucherUrl: '',
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

  // Price list modal state
  const [showPriceListModal, setShowPriceListModal] = useState(true);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);

  // Form data
  const [formData, setFormData] = useState<SaleFormData>(INITIAL_FORM_DATA);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [payments, setPayments] = useState<SalePayment[]>([createEmptyPayment()]);
  const [currentPayment, setCurrentPayment] = useState<SalePayment>(createEmptyPayment());
  const [orderSituation, setOrderSituation] = useState<string>('');

  // Dropdown data
  const [salesData, setSalesData] = useState<SalesFormDataResponse | null>(null);
  const [allShippingCosts, setAllShippingCosts] = useState<ShippingCost[]>([]);

  // UI state
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Notes state (chat-style)
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteImageFile, setNoteImageFile] = useState<File | null>(null);
  const [noteImagePreview, setNoteImagePreview] = useState<string | null>(null);

  // Load initial form data
  useEffect(() => {
    loadFormData();
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

  // Computed: Available shipping costs based on selected location
  const availableShippingCosts = useMemo(() => {
    if (!formData.countryId || !formData.stateId || !formData.cityId || !formData.neighborhoodId) {
      return [];
    }
    return filterShippingCostsByLocation(
      allShippingCosts,
      Number(formData.countryId),
      Number(formData.stateId),
      Number(formData.cityId),
      Number(formData.neighborhoodId)
    );
  }, [allShippingCosts, formData.countryId, formData.stateId, formData.cityId, formData.neighborhoodId]);

  // Computed: All variations flattened for search
  const allVariations = useMemo(() => {
    if (!salesData?.products) return [];
    return salesData.products.flatMap((product) =>
      product.variations.map((variation) => ({
        ...variation,
        productTitle: product.title,
      }))
    );
  }, [salesData?.products]);

  // Computed: Filtered variations by search query
  const filteredVariations = useMemo(() => {
    if (!searchQuery) return allVariations;
    const query = searchQuery.toLowerCase();
    return allVariations.filter((variation) => {
      const productTitle = variation.productTitle.toLowerCase();
      const sku = variation.sku?.toLowerCase() || '';
      const termsNames = variation.terms.map((t) => t.name.toLowerCase()).join(' ');
      return productTitle.includes(query) || sku.includes(query) || termsNames.includes(query);
    });
  }, [allVariations, searchQuery]);

  // Computed: Filtered states by country
  const filteredStates = useMemo(() => {
    if (!salesData?.states || !formData.countryId) return [];
    return salesData.states.filter((s) => s.countryId === Number(formData.countryId));
  }, [salesData?.states, formData.countryId]);

  // Computed: Filtered cities by state
  const filteredCities = useMemo(() => {
    if (!salesData?.cities || !formData.stateId) return [];
    return salesData.cities.filter((c) => c.stateId === Number(formData.stateId));
  }, [salesData?.cities, formData.stateId]);

  // Computed: Filtered neighborhoods by city
  const filteredNeighborhoods = useMemo(() => {
    if (!salesData?.neighborhoods || !formData.cityId) return [];
    return salesData.neighborhoods.filter((n) => n.cityId === Number(formData.cityId));
  }, [salesData?.neighborhoods, formData.cityId]);

  // Computed: Totals
  const subtotal = useMemo(() => calculateSubtotal(products), [products]);
  const discountAmount = useMemo(() => calculateDiscountAmount(products), [products]);
  const shippingCostValue = formData.shippingCost ? parseFloat(formData.shippingCost) : 0;
  const total = useMemo(
    () => calculateTotal(products, shippingCostValue),
    [products, shippingCostValue]
  );

  // Computed: Check if selected document type is persona jurídica (company)
  const isPersonaJuridica = useMemo(() => {
    if (!formData.documentType || !salesData?.documentTypes) return false;
    const selectedDocType = salesData.documentTypes.find(
      (dt) => dt.id.toString() === formData.documentType
    );
    return selectedDocType?.personType === 2;
  }, [formData.documentType, salesData?.documentTypes]);

  // Load form data from API
  const loadFormData = async () => {
    try {
      const data = await fetchSalesFormData();
      setSalesData(adaptSalesFormData(data));
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del formulario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load shipping costs
  const loadShippingCosts = async () => {
    try {
      const data = await fetchShippingCosts();
      setAllShippingCosts(adaptShippingCosts(data || []));
    } catch (error) {
      console.error('Error loading shipping costs:', error);
    }
  };

  // Load price lists
  const loadPriceLists = async () => {
    try {
      setPriceListsLoading(true);
      const data = await fetchPriceLists();
      setPriceLists(adaptPriceLists(data || []));
    } catch (error) {
      console.error('Error loading price lists:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las listas de precios',
        variant: 'destructive',
      });
    } finally {
      setPriceListsLoading(false);
    }
  };

  // Handle price list selection from modal
  const handleSelectPriceList = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, priceListId: id }));
    setShowPriceListModal(false);
  }, []);

  // Load order data for editing
  const loadOrderData = async (id: number) => {
    try {
      setLoading(true);
      const order = await fetchOrderById(id);

      // Set form data
      setFormData({
        documentType: order.document_type?.toString() || '',
        documentNumber: order.document_number || '',
        customerName: order.customer_name || '',
        customerLastname: order.customer_lastname || '',
        customerLastname2: '',
        email: order.email || '',
        phone: order.phone?.toString() || '',
        saleType: order.sale_type_id?.toString() || '',
        priceListId: '',
        saleDate: order.date?.split('T')[0] || getTodayDate(),
        vendorName: '',
        shippingMethod: order.shipping_method_code?.toString() || '',
        shippingCost: '',
        countryId: order.country_id?.toString() || '',
        stateId: order.state_id?.toString() || '',
        cityId: order.city_id?.toString() || '',
        neighborhoodId: order.neighborhood_id?.toString() || '',
        address: order.address || '',
        addressReference: order.address_reference || '',
        receptionPerson: order.reception_person || '',
        receptionPhone: order.reception_phone?.toString() || '',
        withShipping: !!order.shipping_method_code,
        employeeSale: false,
        notes: '',
      });

      // Load products
      const variationIds = (order.order_products || []).map((op: any) => op.product_variation_id);
      if (variationIds.length > 0) {
        const variationsData = await fetchVariationsByIds(variationIds);
        const productIds = Array.from(new Set((variationsData || []).map((v: any) => v.product_id)));
        const productsData = await fetchProductsByIds(productIds as number[]);
        const vtData = await fetchVariationTerms(variationIds);
        const termIds = Array.from(new Set((vtData || []).map((vt: any) => vt.term_id)));
        const termsData = await fetchTermsByIds(termIds as number[]);

        const productMap = new Map((productsData || []).map((p: any) => [p.id, p.title]));
        const termsMap = new Map((termsData || []).map((t: any) => [t.id, t.name]));
        const termsByVariation = new Map<number, string[]>();
        (vtData || []).forEach((vt: any) => {
          const name = termsMap.get(vt.term_id);
          if (!name) return;
          const arr = termsByVariation.get(vt.product_variation_id) || [];
          arr.push(name);
          termsByVariation.set(vt.product_variation_id, arr);
        });

        const loadedProducts: SaleProduct[] = (order.order_products || []).map((op: any) => {
          const v = (variationsData || []).find((vv: any) => vv.id === op.product_variation_id);
          const productTitle = v ? (productMap.get(v.product_id) || '') : '';
          const termsNames = termsByVariation.get(op.product_variation_id)?.join(' / ') || '';
          
          // Convert discount amount to percentage
          const lineSubtotal = op.quantity * parseFloat(op.product_price);
          const discountPercent = lineSubtotal > 0 
            ? (parseFloat(op.product_discount) / lineSubtotal) * 100 
            : 0;

          return {
            variationId: op.product_variation_id,
            productName: productTitle,
            variationName: termsNames || (v?.sku || ''),
            sku: v?.sku || '',
            quantity: op.quantity,
            price: parseFloat(op.product_price),
            discountPercent: Math.round(discountPercent * 100) / 100,
          };
        });
        setProducts(loadedProducts);
      }

      setClientFound(true);

      // Load payment
      const paymentData = await fetchOrderPayment(id);
      if (paymentData) {
        setPayments([{
          id: crypto.randomUUID(),
          paymentMethodId: paymentData.payment_method_id?.toString() || '',
          amount: paymentData.amount?.toString() || '',
          confirmationCode: paymentData.gateway_confirmation_code || '',
          voucherUrl: paymentData.baucher_url || '',
        }]);
      }

      // Load situation
      const situationData = await fetchOrderSituation(id);
      if (situationData) {
        setOrderSituation(situationData.situation_id.toString());
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la venta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = useCallback((field: keyof SaleFormData, value: string | boolean) => {
    // When document type changes to persona jurídica, clear lastname fields
    if (field === 'documentType' && typeof value === 'string') {
      const selectedDocType = salesData?.documentTypes.find(
        (dt) => dt.id.toString() === value
      );
      if (selectedDocType?.personType === 2) {
        // Persona jurídica: clear lastnames
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          customerLastname: '',
          customerLastname2: '',
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // When shipping method changes, update the cost
    if (field === 'shippingMethod' && value) {
      const selectedCost = allShippingCosts.find((sc) => sc.id.toString() === value);
      if (selectedCost) {
        setFormData((prev) => ({ ...prev, shippingCost: selectedCost.cost.toString() }));
      }
    }

    // Reset child fields when parent location changes
    if (field === 'countryId') {
      setFormData((prev) => ({ ...prev, stateId: '', cityId: '', neighborhoodId: '' }));
    }
    if (field === 'stateId') {
      setFormData((prev) => ({ ...prev, cityId: '', neighborhoodId: '' }));
    }
    if (field === 'cityId') {
      setFormData((prev) => ({ ...prev, neighborhoodId: '' }));
    }
  }, [allShippingCosts, salesData?.documentTypes]);

  // Handle current payment changes
  const handlePaymentChange = useCallback((field: keyof SalePayment, value: string) => {
    setCurrentPayment((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Add payment to list
  const addPayment = useCallback(() => {
    if (!currentPayment.paymentMethodId || !currentPayment.amount) {
      toast({
        title: 'Error',
        description: 'Seleccione método de pago y monto',
        variant: 'destructive',
      });
      return;
    }
    setPayments((prev) => [...prev, { ...currentPayment, id: crypto.randomUUID() }]);
    setCurrentPayment(createEmptyPayment());
  }, [currentPayment, toast]);

  // Remove payment from list
  const removePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  }, []);

  // Update payment in list
  const updatePaymentInList = useCallback((paymentId: string, field: keyof SalePayment, value: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, [field]: value } : p))
    );
  }, []);

  // Search client by document
  const handleSearchClient = useCallback(async (overrideDocumentType?: string) => {
    const docType = overrideDocumentType || formData.documentType;
    if (!docType || !formData.documentNumber) return;

    setSearchingClient(true);
    try {
      // First, search in accounts table
      const data = await searchClientByDocument(
        parseInt(docType),
        formData.documentNumber
      );
      const client = adaptClientSearchResult(data);

      if (client) {
        // Client exists in database
        setClientFound(true);
        setFormData((prev) => ({
          ...prev,
          customerName: client.name,
          customerLastname: client.lastName,
          customerLastname2: client.lastName2 || '',
        }));
      } else {
        // Client not found - check document type code
        const selectedDocType = salesData?.documentTypes.find(
          (dt) => dt.id.toString() === docType
        );
        const docTypeCode = selectedDocType?.code?.toUpperCase();

        if (docTypeCode === 'DNI' || docTypeCode === 'RUC') {
          // Query external API for DNI/RUC
          try {
            const lookupResult = await lookupDocument(docTypeCode, formData.documentNumber);

            if (lookupResult?.found) {
              setClientFound(true); // Lock fields when data found from external API
              
              // Check if persona jurídica (RUC) - use razón social
              if (docTypeCode === 'RUC') {
                setFormData((prev) => ({
                  ...prev,
                  customerName: lookupResult.razonSocial || lookupResult.nombres || '',
                  customerLastname: '',
                  customerLastname2: '',
                }));
              } else {
                // Persona natural (DNI) - use nombres y apellidos
                setFormData((prev) => ({
                  ...prev,
                  customerName: lookupResult.nombres || '',
                  customerLastname: lookupResult.apellidoPaterno || '',
                  customerLastname2: lookupResult.apellidoMaterno || '',
                }));
              }
              toast({
                title: 'Datos encontrados',
                description: docTypeCode === 'RUC' 
                  ? 'Se encontraron datos de la empresa en SUNAT'
                  : 'Se encontraron datos del documento en RENIEC',
              });
            } else {
              // DNI/RUC not found in external API
              setClientFound(false);
              setFormData((prev) => ({
                ...prev,
                customerName: '',
                customerLastname: '',
                customerLastname2: '',
              }));
              toast({
                title: 'Documento no encontrado',
                description: 'No se encontraron datos para este documento',
                variant: 'destructive',
              });
            }
          } catch (lookupError) {
            console.error('Error looking up document:', lookupError);
            // On API error, still allow manual input
            setClientFound(false);
            setFormData((prev) => ({
              ...prev,
              customerName: '',
              customerLastname: '',
              customerLastname2: '',
            }));
            toast({
              title: 'Error de consulta',
              description: 'No se pudo consultar el documento. Ingrese los datos manualmente.',
              variant: 'destructive',
            });
          }
        } else {
          // Other document types (Passport, etc.) - enable manual input
          setClientFound(false);
          setFormData((prev) => ({
            ...prev,
            customerName: '',
            customerLastname: '',
            customerLastname2: '',
          }));
        }
      }
    } catch (error) {
      console.error('Error searching client:', error);
      toast({
        title: 'Error',
        description: 'No se pudo buscar el cliente',
        variant: 'destructive',
      });
    } finally {
      setSearchingClient(false);
    }
  }, [formData.documentType, formData.documentNumber, salesData?.documentTypes, toast]);

  // Add product to list
  const addProduct = useCallback(() => {
    if (!selectedVariation) {
      toast({
        title: 'Error',
        description: 'Seleccione una variación',
        variant: 'destructive',
      });
      return;
    }

    // Find price for selected price list
    const priceListId = formData.priceListId ? parseInt(formData.priceListId) : null;
    const priceEntry = priceListId
      ? selectedVariation.prices.find((p) => p.priceListId === priceListId)
      : selectedVariation.prices[0];
    
    const price = priceEntry?.salePrice || priceEntry?.price || 0;
    const termsNames = selectedVariation.terms.map((t) => t.name).join(' / ');

    setProducts((prev) => [
      ...prev,
      {
        variationId: selectedVariation.id,
        productName: selectedVariation.productTitle,
        variationName: termsNames || selectedVariation.sku,
        sku: selectedVariation.sku,
        quantity: 1,
        price,
        discountPercent: 0,
      },
    ]);

    setSearchQuery('');
    setSelectedVariation(null);
  }, [selectedVariation, formData.priceListId, toast]);

  // Remove product from list
  const removeProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Update product in list
  const updateProduct = useCallback((index: number, field: keyof SaleProduct, value: any) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

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
      userName: 'Usuario', // TODO: Get from auth context
    };

    setNotes((prev) => [...prev, newNote]);
    setNewNoteText('');
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
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (products.length === 0) {
      toast({
        title: 'Error',
        description: 'Agregue al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    if (!orderSituation) {
      toast({
        title: 'Error',
        description: 'Seleccione un estado para el pedido',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const orderData = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        customerName: formData.customerName,
        customerLastname: formData.customerLastname,
        customerLastname2: formData.customerLastname2 || null,
        email: formData.email || null,
        phone: formData.phone || null,
        saleType: formData.saleType,
        priceListId: formData.priceListId || null,
        shippingMethod: formData.shippingMethod || null,
        shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : null,
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
        products: products.map((p) => ({
          variationId: p.variationId,
          quantity: p.quantity,
          price: p.price,
          discountPercent: p.discountPercent,
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

      if (orderId) {
        await updateOrder(parseInt(orderId), orderData);
      } else {
        const response = await createOrder(orderData);
        if (response?.order?.id) {
          createdOrderId = response.order.id;
        }
      }

      // Update order situation
      if (orderSituation && createdOrderId) {
        await updateOrderSituation(createdOrderId, parseInt(orderSituation));
      }

      toast({
        title: 'Éxito',
        description: orderId ? 'Venta actualizada correctamente' : 'Venta creada correctamente',
      });

      navigate('/sales/list');
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: 'Error',
        description: orderId ? 'No se pudo actualizar la venta' : 'No se pudo crear la venta',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [formData, products, payments, orderSituation, orderId, subtotal, discountAmount, total, toast, navigate]);

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
    
    // Notes state (chat-style)
    notes,
    newNoteText,
    noteImagePreview,
    
    // Price list modal
    showPriceListModal,
    priceLists,
    priceListsLoading,
    
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

    // Actions
    setOrderSituation,
    setSelectedVariation,
    setSearchQuery,
    handleInputChange,
    handlePaymentChange,
    addPayment,
    removePayment,
    updatePaymentInList,
    handleSearchClient,
    handleSelectPriceList,
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
  };
};
