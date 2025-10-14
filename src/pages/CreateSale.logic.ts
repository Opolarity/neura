import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    loadFormData();
  }, []);

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

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    return calculateSubtotal() - calculateDiscount();
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

      const { error } = await supabase.functions.invoke('create-order', {
        body: orderData,
      });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Venta creada correctamente',
      });

      navigate('/sales');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la venta',
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
