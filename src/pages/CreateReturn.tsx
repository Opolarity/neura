import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Order {
  id: number;
  document_number: string;
  customer_name: string;
  customer_lastname: string;
  total: number;
  created_at: string;
  document_type: number;
}

interface OrderProduct {
  id: number;
  product_variation_id: number;
  quantity: number;
  product_price: number;
  product_discount: number;
  variations: {
    sku: string;
    products: {
      title: string;
    };
  };
}

interface ReturnProduct {
  product_variation_id: number;
  quantity: number;
  product_name: string;
  sku: string;
  price: number;
  output: boolean;
}

interface NewProduct {
  variation_id: number;
  product_name: string;
  variation_name: string;
  quantity: number;
  price: number;
  discount: number;
}

const CreateReturn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnTypes, setReturnTypes] = useState<any[]>([]);
  const [situations, setSituations] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturnType, setSelectedReturnType] = useState<string>('');
  const [returnTypeCode, setReturnTypeCode] = useState<string>('');
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form fields
  const [reason, setReason] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [shippingReturn, setShippingReturn] = useState(false);
  const [situationId, setSituationId] = useState('');
  const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
  
  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [open, setOpen] = useState(false);
  
  // Order search and pagination
  const [orderSearch, setOrderSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get all orders for the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, document_number, customer_name, customer_lastname, total, created_at, document_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get returns to exclude orders that already have a return/exchange
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('order_id');

      if (returnsError) throw returnsError;

      const returnedOrderIds = new Set((returnsData || []).map((r: any) => r.order_id));
      const availableOrders = (ordersData || []).filter((order) => !returnedOrderIds.has(order.id));

      // Get return types from module "CAM"
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('code', 'CAM')
        .single();

      if (moduleError) throw moduleError;

      const { data: typesData, error: typesError } = await supabase
        .from('types')
        .select('*')
        .eq('module_id', moduleData.id);

      if (typesError) throw typesError;

      // Get situations from module "CAM"
      const { data: situationsData, error: situationsError } = await supabase
        .from('situations')
        .select('*')
        .eq('module_id', moduleData.id);

      if (situationsError) throw situationsError;

      // Get document types
      const { data: docTypesData, error: docTypesError } = await supabase
        .from('document_types')
        .select('*');

      if (docTypesError) throw docTypesError;

      // Get products for new products section
      const { data: productsData, error: productsError } = await supabase.functions.invoke('get-products-list');
      if (productsError) throw productsError;

      setOrders(availableOrders);
      setReturnTypes(typesData || []);
      setSituations(situationsData || []);
      setDocumentTypes(docTypesData || []);
      setProducts(productsData?.products || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = async () => {
    if (!selectedOrder || !selectedReturnType) {
      toast.error('Debe seleccionar una orden y un tipo de devolución');
      return;
    }

    const selectedType = returnTypes.find(t => t.id === parseInt(selectedReturnType));
    setReturnTypeCode(selectedType?.code || '');

    // Load order products
    const { data: orderProductsData, error } = await supabase
      .from('order_products')
      .select(`
        *,
        variations (
          sku,
          products (
            title
          )
        )
      `)
      .eq('order_id', selectedOrder.id);

    if (error) {
      console.error('Error loading order products:', error);
      toast.error('Error al cargar los productos de la orden');
      return;
    }

    setOrderProducts(orderProductsData || []);
    setDocumentType(selectedOrder.document_type.toString());
    setDocumentNumber(selectedOrder.document_number);
    setShowOrderModal(false);
  };

  // Filter and paginate orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchTerm = orderSearch.toLowerCase();
      return (
        order.document_number.toLowerCase().includes(searchTerm) ||
        order.customer_name?.toLowerCase().includes(searchTerm) ||
        order.customer_lastname?.toLowerCase().includes(searchTerm)
      );
    });
  }, [orders, orderSearch]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const allVariations = useMemo(() => {
    if (!products) return [];
    
    return products.flatMap((product) =>
      product.variations.map((variation: any) => ({
        ...variation,
        product_id: product.id,
        product_title: product.title,
      }))
    );
  }, [products]);

  const filteredVariations = useMemo(() => {
    if (!searchQuery) return allVariations;
    
    const query = searchQuery.toLowerCase();
    return allVariations.filter((variation) => {
      const productTitle = variation.product_title.toLowerCase();
      const sku = variation.sku?.toLowerCase() || '';
      const termsNames = variation.terms.map((t: any) => t.terms.name.toLowerCase()).join(' ');
      
      return productTitle.includes(query) || sku.includes(query) || termsNames.includes(query);
    });
  }, [allVariations, searchQuery]);

  const toggleReturnProduct = (product: OrderProduct, quantity: number) => {
    const existing = returnProducts.find(p => p.product_variation_id === product.product_variation_id);
    
    if (quantity === 0 && existing) {
      setReturnProducts(returnProducts.filter(p => p.product_variation_id !== product.product_variation_id));
    } else if (quantity > 0) {
      const newProduct: ReturnProduct = {
        product_variation_id: product.product_variation_id,
        quantity,
        product_name: product.variations.products.title,
        sku: product.variations.sku,
        price: product.product_price * (1 - product.product_discount / 100),
        output: false
      };

      if (existing) {
        setReturnProducts(returnProducts.map(p => 
          p.product_variation_id === product.product_variation_id ? newProduct : p
        ));
      } else {
        setReturnProducts([...returnProducts, newProduct]);
      }
    }
  };

  const addNewProduct = () => {
    if (!selectedVariation) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    const termsNames = selectedVariation.terms.map((t: any) => t.terms.name).join(' - ');
    const newProduct: NewProduct = {
      variation_id: selectedVariation.id,
      product_name: selectedVariation.product_title,
      variation_name: termsNames,
      quantity: 1,
      price: selectedVariation.prices[0]?.price || 0,
      discount: 0
    };

    setNewProducts([...newProducts, newProduct]);
    setSelectedVariation(null);
    setSearchQuery('');
    setOpen(false);
  };

  const removeNewProduct = (index: number) => {
    setNewProducts(newProducts.filter((_, i) => i !== index));
  };

  const updateNewProduct = (index: number, field: string, value: any) => {
    setNewProducts(newProducts.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const calculateReturnTotal = () => {
    return returnProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const calculateNewProductsTotal = () => {
    return newProducts.reduce((sum, p) => {
      const discountedPrice = p.price * (1 - p.discount / 100);
      return sum + (discountedPrice * p.quantity);
    }, 0);
  };

  const calculateSubtotal = (price: number, quantity: number, discount: number) => {
    const discountedPrice = price * (1 - discount / 100);
    return discountedPrice * quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !selectedReturnType || !situationId) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let totalRefundAmount = 0;
      let totalExchangeDifference = 0;

      if (returnTypeCode === 'DVT') {
        // Total return - refund full order amount
        totalRefundAmount = selectedOrder.total;
      } else if (returnTypeCode === 'DVP') {
        // Partial return - refund selected products
        totalRefundAmount = calculateReturnTotal();
      } else if (returnTypeCode === 'CAM') {
        // Exchange - calculate difference
        const returnTotal = calculateReturnTotal();
        const newTotal = calculateNewProductsTotal();
        const difference = returnTotal - newTotal;

        if (difference === 0) {
          totalRefundAmount = 0;
        } else if (difference > 0) {
          totalRefundAmount = difference;
        } else {
          totalExchangeDifference = Math.abs(difference);
          totalRefundAmount = 0;
        }
      }

      // Insert return
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          order_id: selectedOrder.id,
          return_type_id: parseInt(selectedReturnType),
          customer_document_number: documentNumber,
          customer_document_type_id: parseInt(documentType),
          reason,
          shipping_return: shippingReturn,
          situation_id: parseInt(situationId),
          status_id: situations.find(s => s.id === parseInt(situationId))?.status_id,
          created_by: user.id,
          total_refund_amount: totalRefundAmount,
          total_exchange_difference: totalExchangeDifference
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Insert return products (incoming)
      if (returnProducts.length > 0) {
        const returnProductsData = returnProducts.map(p => ({
          return_id: returnData.id,
          product_variation_id: p.product_variation_id,
          quantity: p.quantity,
          product_amount: p.price,
          output: false
        }));

        const { error: productsError } = await supabase
          .from('returns_products')
          .insert(returnProductsData);

        if (productsError) throw productsError;
      }

      // Insert new products (outgoing) for exchanges
      if (newProducts.length > 0 && returnTypeCode === 'CAM') {
        const newProductsData = newProducts.map(p => ({
          return_id: returnData.id,
          product_variation_id: p.variation_id,
          quantity: p.quantity,
          product_amount: calculateSubtotal(p.price, 1, p.discount),
          output: true
        }));

        const { error: newProductsError } = await supabase
          .from('returns_products')
          .insert(newProductsData);

        if (newProductsError) throw newProductsError;
      }

      // Check if situation has status "CFM" to update stock
      const selectedSituation = situations.find(s => s.id === parseInt(situationId));
      if (selectedSituation) {
        const { data: statusData } = await supabase
          .from('statuses')
          .select('code')
          .eq('id', selectedSituation.status_id)
          .single();

        if (statusData?.code === 'CFM') {
          // Create stock movements
          const allReturnProducts = [
            ...returnProducts.map(p => ({ ...p, output: false })),
            ...newProducts.map(p => ({
              product_variation_id: p.variation_id,
              quantity: p.quantity,
              output: true
            }))
          ];

          for (const product of allReturnProducts) {
            // Get movement type for returns
            const { data: returnMovementType } = await supabase
              .from('types')
              .select('id')
              .eq('module_id', 3) // Stock movements module
              .limit(1)
              .single();

            // Create stock movement
            await supabase.from('stock_movements').insert({
              product_variation_id: product.product_variation_id,
              quantity: product.output ? -product.quantity : product.quantity,
              created_by: user.id,
              movement_type: returnMovementType?.id || 1,
              order_id: selectedOrder.id,
              out_warehouse_id: 1,
              in_warehouse_id: 1,
              defect_stock: false,
            });

            // Update stock - get current stock for warehouse 1
            const { data: currentStock } = await supabase
              .from('product_stock')
              .select('stock')
              .eq('product_variation_id', product.product_variation_id)
              .eq('warehouse_id', 1)
              .single();

            if (currentStock) {
              const newStock = currentStock.stock + (product.output ? -product.quantity : product.quantity);
              await supabase
                .from('product_stock')
                .update({ stock: newStock })
                .eq('product_variation_id', product.product_variation_id)
                .eq('warehouse_id', 1);
            }
          }
        }
      }

      toast.success('Devolución/Cambio creado exitosamente');
      navigate('/returns');
    } catch (error: any) {
      console.error('Error creating return:', error);
      toast.error('Error al crear la devolución/cambio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Order Selection Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Orden y Tipo de Devolución</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="returnType">Tipo de Devolución/Cambio *</Label>
                <Select value={selectedReturnType} onValueChange={setSelectedReturnType}>
                  <SelectTrigger id="returnType">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orderSearch">Buscar Orden</Label>
                <Input
                  id="orderSearch"
                  placeholder="Buscar por número o cliente..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Órdenes Disponibles</Label>
              <div className="grid gap-2 mt-2">
                {paginatedOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {orderSearch ? 'No se encontraron órdenes' : 'No hay órdenes disponibles para devolución'}
                  </p>
                ) : (
                  paginatedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">Orden #{order.document_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.customer_name} {order.customer_lastname}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">${order.total.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/returns')}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!selectedReturnType) {
                  toast.error('Debe seleccionar un tipo de devolución/cambio');
                  return;
                }
                if (!selectedOrder) {
                  toast.error('Debe seleccionar una orden');
                  return;
                }
                handleOrderSelect();
              }} 
              disabled={!selectedOrder || !selectedReturnType}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/returns')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Nueva Devolución/Cambio</h1>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/returns')}>
              Cancelar
            </Button>
            <Button type="submit" form="return-form" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Devolución/Cambio
            </Button>
          </div>
        </div>

        <form id="return-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID de Orden</Label>
                  <Input value={selectedOrder?.id || ''} disabled />
                </div>
                <div>
                  <Label>Situación</Label>
                  <Select value={situationId} onValueChange={setSituationId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la situación" />
                    </SelectTrigger>
                    <SelectContent>
                      {situations.map((situation) => (
                        <SelectItem key={situation.id} value={situation.id.toString()}>
                          {situation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Documento</Label>
                  <Input 
                    value={documentNumber} 
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Razón de la Devolución/Cambio</Label>
                <Textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={shippingReturn} 
                  onCheckedChange={setShippingReturn}
                  id="shipping-return"
                />
                <Label htmlFor="shipping-return">Devolver el envío</Label>
              </div>
            </CardContent>
          </Card>

          {/* Products to Return - Only for DVP and CAM */}
          {(returnTypeCode === 'DVP' || returnTypeCode === 'CAM') && (
            <Card>
              <CardHeader>
                <CardTitle>Productos a Devolver</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Cantidad Máx.</TableHead>
                      <TableHead>Cantidad a Devolver</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.variations.products.title}</TableCell>
                        <TableCell>{product.variations.sku}</TableCell>
                        <TableCell>
                          ${(product.product_price * (1 - product.product_discount / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={product.quantity}
                            value={returnProducts.find(p => p.product_variation_id === product.product_variation_id)?.quantity || 0}
                            onChange={(e) => toggleReturnProduct(product, parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          ${((returnProducts.find(p => p.product_variation_id === product.product_variation_id)?.quantity || 0) * 
                            product.product_price * (1 - product.product_discount / 100)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-right">
                  <p className="text-lg font-bold">
                    Total a Devolver: ${calculateReturnTotal().toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Products - Only for CAM */}
          {returnTypeCode === 'CAM' && (
            <Card>
              <CardHeader>
                <CardTitle>Productos Nuevos (Cambio)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Buscar Producto</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedVariation 
                          ? `${selectedVariation.product_title} - ${selectedVariation.terms.map((t: any) => t.terms.name).join(' ')}`
                          : "Buscar producto..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[600px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar por nombre o SKU..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron productos</CommandEmpty>
                          <CommandGroup>
                            {filteredVariations.map((variation) => (
                              <CommandItem
                                key={variation.id}
                                value={`${variation.product_title} ${variation.sku}`}
                                onSelect={() => {
                                  setSelectedVariation(variation);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedVariation?.id === variation.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{variation.product_title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {variation.terms.map((t: any) => t.terms.name).join(' - ')} - SKU: {variation.sku}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="button" onClick={addNewProduct} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>

                {newProducts.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variación</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Descuento %</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell>{product.variation_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => updateNewProduct(index, 'price', parseFloat(e.target.value))}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateNewProduct(index, 'quantity', parseInt(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={product.discount}
                              onChange={(e) => updateNewProduct(index, 'discount', parseFloat(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            ${calculateSubtotal(product.price, product.quantity, product.discount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNewProduct(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-4 space-y-2 text-right">
                  <p className="text-lg">
                    Total Productos Nuevos: ${calculateNewProductsTotal().toFixed(2)}
                  </p>
                  <p className="text-lg font-bold">
                    {calculateReturnTotal() - calculateNewProductsTotal() >= 0
                      ? `A Reembolsar: $${(calculateReturnTotal() - calculateNewProductsTotal()).toFixed(2)}`
                      : `Diferencia a Pagar: $${(calculateNewProductsTotal() - calculateReturnTotal()).toFixed(2)}`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </>
  );
};

export default CreateReturn;
