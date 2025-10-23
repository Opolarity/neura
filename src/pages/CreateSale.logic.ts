import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  document_type: string;
  document_number: string;
  customer_name: string;
  customer_lastname: string;
  customer_lastname2: string;
  email: string;
  phone: string;
  sale_type: string;
  shipping_method: string;
  shipping_cost: string;
  country_id: string;
  state_id: string;
  city_id: string;
  neighborhood_id: string;
  address: string;
  address_reference: string;
  reception_person: string;
  reception_phone: string;
  with_shipping: boolean;
  employee_sale: boolean;
}

interface Product {
  variation_id: number;
  product_name: string;
  variation_name: string;
  quantity: number;
  price: number;
  discount: number;
}

interface SalesFormData {
  documentTypes: any[];
  saleTypes: any[];
  shippingMethods: any[];
  countries: any[];
  states: any[];
  cities: any[];
  neighborhoods: any[];
  products: any[];
  paymentMethods: any[];
}

export const useCreateSaleLogic = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    document_type: '',
    document_number: '',
    customer_name: '',
    customer_lastname: '',
    customer_lastname2: '',
    email: '',
    phone: '',
    sale_type: '',
    shipping_method: '',
    shipping_cost: '',
    country_id: '',
    state_id: '',
    city_id: '',
    neighborhood_id: '',
    address: '',
    address_reference: '',
    reception_person: '',
    reception_phone: '',
    with_shipping: false,
    employee_sale: false,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<SalesFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [searchingClient, setSearchingClient] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [availableShippingCosts, setAvailableShippingCosts] = useState<any[]>([]);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (orderId && salesData) {
      loadOrderData(parseInt(orderId));
    }
  }, [orderId, salesData]);

  useEffect(() => {
    if (formData.with_shipping && (formData.country_id || formData.state_id || formData.city_id || formData.neighborhood_id)) {
      loadShippingCosts();
    }
  }, [formData.country_id, formData.state_id, formData.city_id, formData.neighborhood_id, formData.with_shipping]);

  const loadFormData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-sales-form-data');
      if (error) throw error;
      setSalesData(data);
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

  const loadOrderData = async (id: number) => {
    try {
      setLoading(true);
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_products(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Load form data
      setFormData({
        document_type: order.document_type?.toString() || '',
        document_number: order.document_number || '',
        customer_name: order.customer_name || '',
        customer_lastname: order.customer_lastname || '',
        customer_lastname2: '',
        email: order.email || '',
        phone: order.phone?.toString() || '',
        sale_type: order.sale_type?.toString() || '',
        shipping_method: order.shipping_method?.toString() || '',
        shipping_cost: '',
        country_id: order.country_id?.toString() || '',
        state_id: order.state_id?.toString() || '',
        city_id: order.city_id?.toString() || '',
        neighborhood_id: order.neighborhood_id?.toString() || '',
        address: order.address || '',
        address_reference: order.address_reference || '',
        reception_person: order.reception_person || '',
        reception_phone: order.reception_phone?.toString() || '',
        with_shipping: !!order.shipping_method,
        employee_sale: false,
      });

      // Load products - without relying on FK relationships
      const variationIds = (order.order_products || []).map((op: any) => op.product_variation_id);

      let loadedProducts: Product[] = [];
      if (variationIds.length > 0) {
        const { data: variationsData } = await supabase
          .from('variations')
          .select('id, sku, product_id')
          .in('id', variationIds);

        const productIds = Array.from(new Set((variationsData || []).map((v: any) => v.product_id)));
        const { data: productsData } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds.length ? productIds : [-1]);

        const { data: vtData } = await supabase
          .from('variation_terms')
          .select('product_variation_id, term_id')
          .in('product_variation_id', variationIds);

        const termIds = Array.from(new Set((vtData || []).map((vt: any) => vt.term_id)));
        const { data: termsData } = await supabase
          .from('terms')
          .select('id, name')
          .in('id', termIds.length ? termIds : [-1]);

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

        loadedProducts = (order.order_products || []).map((op: any) => {
          const v = (variationsData || []).find((vv: any) => vv.id === op.product_variation_id);
          const productTitle = v ? (productMap.get(v.product_id) || '') : '';
          const termsNames = termsByVariation.get(op.product_variation_id)?.join(' / ') || '';

          return {
            variation_id: op.product_variation_id,
            product_name: productTitle,
            variation_name: termsNames || (v?.sku || ''),
            quantity: op.quantity,
            price: parseFloat(op.product_price),
            discount: parseFloat(op.product_discount),
          };
        });
      }

      setProducts(loadedProducts);
      setClientFound(true);
      
      console.log('Loaded products:', loadedProducts);
      
      console.log('Loaded products:', loadedProducts);
      
      // Load payment information
      const { data: paymentData } = await supabase
        .from('order_payment')
        .select('*')
        .eq('order_id', id)
        .maybeSingle();
      
      if (paymentData) {
        setPaymentMethod(paymentData.payment_method_id?.toString() || '');
        setPaymentAmount(paymentData.amount?.toString() || '');
        setConfirmationCode(paymentData.gateway_confirmation_code || '');
        console.log('Loaded payment:', paymentData);
      }
      
      // Load order status
      const { data: statusData } = await supabase
        .from('order_status')
        .select('status_id')
        .eq('order_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (statusData) {
        setOrderStatus(statusData.status_id.toString());
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

  const loadShippingCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_costs')
        .select('*')
        .or(
          [
            formData.neighborhood_id && `neighborhood_id.eq.${formData.neighborhood_id}`,
            formData.city_id && `city_id.eq.${formData.city_id}`,
            formData.state_id && `state_id.eq.${formData.state_id}`,
            formData.country_id && `country_id.eq.${formData.country_id}`,
          ]
            .filter(Boolean)
            .join(',')
        );

      if (error) throw error;
      setAvailableShippingCosts(data || []);
    } catch (error) {
      console.error('Error loading shipping costs:', error);
      setAvailableShippingCosts([]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // When shipping method changes, update the cost
    if (field === 'shipping_method' && value) {
      const selectedCost = availableShippingCosts.find(sc => sc.id.toString() === value);
      if (selectedCost) {
        setFormData((prev) => ({ ...prev, shipping_cost: selectedCost.cost.toString() }));
      }
    }
  };

  const searchClient = async () => {
    if (!formData.document_type || !formData.document_number) {
      return;
    }

    setSearchingClient(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('document_type_id', parseInt(formData.document_type))
        .eq('document_number', formData.document_number)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClientFound(true);
        setFormData((prev) => ({
          ...prev,
          customer_name: data.name,
          customer_lastname: data.last_name,
          customer_lastname2: data.last_name2 || '',
        }));
      } else {
        setClientFound(false);
        setFormData((prev) => ({
          ...prev,
          customer_name: '',
          customer_lastname: '',
          customer_lastname2: '',
        }));
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
  };

  const addProduct = () => {
    if (!selectedVariation) {
      toast({
        title: 'Error',
        description: 'Seleccione una variación',
        variant: 'destructive',
      });
      return;
    }

    const price = selectedVariation.prices[0]?.sale_price || selectedVariation.prices[0]?.price || 0;
    const termsNames = selectedVariation.terms.map((t: any) => t.terms.name).join(' / ');

    setProducts([
      ...products,
      {
        variation_id: selectedVariation.id,
        product_name: selectedVariation.product_title,
        variation_name: termsNames || selectedVariation.sku,
        quantity: 1,
        price,
        discount: 0,
      },
    ]);

    setSearchQuery('');
    setSelectedVariation(null);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const calculateSubtotal = () => {
    return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  };

  const calculateDiscount = () => {
    return products.reduce((sum, p) => sum + p.quantity * p.discount, 0);
  };

  const calculateTotal = () => {
    const productTotal = calculateSubtotal() - calculateDiscount();
    const shippingCost = formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0;
    return productTotal + shippingCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (products.length === 0) {
      toast({
        title: 'Error',
        description: 'Agregue al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    if (!orderStatus) {
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
        document_type: formData.document_type,
        document_number: formData.document_number,
        customer_name: formData.customer_name,
        customer_lastname: formData.customer_lastname,
        customer_lastname2: formData.customer_lastname2 || null,
        email: formData.email || null,
        phone: formData.phone || null,
        sale_type: formData.sale_type,
        shipping_method: formData.shipping_method || null,
        country_id: formData.country_id || null,
        state_id: formData.state_id || null,
        city_id: formData.city_id || null,
        neighborhood_id: formData.neighborhood_id || null,
        address: formData.address || null,
        address_reference: formData.address_reference || null,
        reception_person: formData.reception_person || null,
        reception_phone: formData.reception_phone || null,
        with_shipping: formData.with_shipping,
        employee_sale: formData.employee_sale,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        total: calculateTotal(),
        products: products.map((p) => ({
          variation_id: p.variation_id,
          quantity: p.quantity,
          price: p.price,
          discount: p.discount,
        })),
        payment: paymentMethod
          ? {
              payment_method_id: parseInt(paymentMethod),
              amount: parseFloat(paymentAmount) || calculateTotal(),
              date: new Date().toISOString(),
              confirmation_code: confirmationCode || null,
            }
          : null,
      };

      let error;
      let createdOrderId = orderId ? parseInt(orderId) : null;
      
      if (orderId) {
        // Update existing order
        const response = await supabase.functions.invoke('update-order', {
          body: { orderId: parseInt(orderId), ...orderData },
        });
        error = response.error;
      } else {
        // Create new order
        const response = await supabase.functions.invoke('create-order', {
          body: orderData,
        });
        error = response.error;
        if (response.data?.order?.id) {
          createdOrderId = response.data.order.id;
        }
      }

      if (error) throw error;

      // Save order status if selected
      if (orderStatus && createdOrderId) {
        const { error: statusError } = await supabase
          .from('order_status')
          .insert({
            order_id: createdOrderId,
            status_id: parseInt(orderStatus),
          });

        if (statusError) {
          console.error('Error saving order status:', statusError);
        }
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
  };

  return {
    loading,
    saving,
    formData,
    products,
    salesData,
    searchQuery,
    selectedVariation,
    paymentMethod,
    paymentAmount,
    confirmationCode,
    clientFound,
    searchingClient,
    orderId,
    orderStatus,
    availableShippingCosts,
    setOrderStatus,
    handleInputChange,
    setSearchQuery,
    setSelectedVariation,
    setPaymentMethod,
    setPaymentAmount,
    setConfirmationCode,
    searchClient,
    addProduct,
    removeProduct,
    updateProduct,
    calculateSubtotal,
    calculateDiscount,
    calculateTotal,
    handleSubmit,
    navigate,
  };
};

export const useViewSale = (orderId?: string) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [saleTypes, setSaleTypes] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);

      // Load form data
      const { data: formDataResponse, error: formError } = await supabase.functions.invoke('get-sales-form-data');
      if (formError) throw formError;

      setDocumentTypes(formDataResponse.documentTypes || []);
      setSaleTypes(formDataResponse.saleTypes || []);
      setShippingMethods(formDataResponse.shippingMethods || []);
      setCountries(formDataResponse.countries || []);
      setStates(formDataResponse.states || []);
      setCities(formDataResponse.cities || []);
      setNeighborhoods(formDataResponse.neighborhoods || []);

      // Load order data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_products(*)')
        .eq('id', parseInt(orderId!))
        .single();

      if (orderError) throw orderError;

      setFormData({
        documentType: order.document_type,
        documentNumber: order.document_number,
        customerName: order.customer_name,
        customerLastname: order.customer_lastname,
        email: order.email,
        phone: order.phone,
        saleType: order.sale_type,
        shippingMethod: order.shipping_method,
        countryId: order.country_id,
        stateId: order.state_id,
        cityId: order.city_id,
        neighborhoodId: order.neighborhood_id,
        address: order.address,
        addressReference: order.address_reference,
        receptionPerson: order.reception_person,
        receptionPhone: order.reception_phone,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
      });

      // Load products with details
      const loadedProducts = await Promise.all(
        order.order_products.map(async (op: any) => {
          const { data: variation } = await supabase
            .from('variations')
            .select('*, products(title), variation_terms(terms(name))')
            .eq('id', op.product_variation_id)
            .single();

          const termsNames = variation?.variation_terms?.map((vt: any) => vt.terms.name).join(' / ') || '';

          return {
            name: `${variation?.products?.title || ''} ${termsNames ? '- ' + termsNames : ''}`,
            quantity: op.quantity,
            price: parseFloat(op.product_price),
            discount: parseFloat(op.product_discount),
          };
        })
      );

      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    formData,
    products,
    documentTypes,
    saleTypes,
    shippingMethods,
    countries,
    states,
    cities,
    neighborhoods,
  };
};
