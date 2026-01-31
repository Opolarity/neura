import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils/utils';

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

const EditReturn = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [situations, setSituations] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [returnTypes, setReturnTypes] = useState<any[]>([]);
  const [selectedReturnType, setSelectedReturnType] = useState<string>('');
  const [returnTypeCode, setReturnTypeCode] = useState<string>('');
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderId, setOrderId] = useState<number>(0);
  
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

  useEffect(() => {
    loadReturnData();
  }, [id]);

  const loadReturnData = async () => {
    try {
      // Load return data
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .select(`
          *,
          types(id, name, code)
        `)
        .eq('id', Number(id))
        .single();

      if (returnError) throw returnError;

      // Load return products
      const { data: returnProductsData, error: returnProductsError } = await supabase
        .from('returns_products')
        .select(`
          *,
          variations (
            sku,
            products (
              title
            )
          )
        `)
        .eq('return_id', Number(id));

      if (returnProductsError) throw returnProductsError;

      // Load order products
      const { data: orderProductsData, error: orderProductsError } = await supabase
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
        .eq('order_id', returnData.order_id);

      if (orderProductsError) throw orderProductsError;

      // Load document types
      const { data: docTypesData } = await supabase
        .from('document_types')
        .select('*');

      // Load situations for returns module (RTU)
      const { data: moduleData } = await supabase
        .from('modules')
        .select('id')
        .eq('code', 'RTU')
        .single();

      if (moduleData) {
        const { data: situationsData } = await supabase
          .from('situations')
          .select('*, statuses(id, name, code)')
          .eq('module_id', moduleData.id);
        setSituations(situationsData || []);

        // Load return types from the same module
        const { data: typesData } = await supabase
          .from('types')
          .select('*')
          .eq('module_id', moduleData.id);
        setReturnTypes(typesData || []);
      }

      // Load all products for exchange
      const { data: productsData } = await supabase
        .from('variations')
        .select(`
          id,
          sku,
          products (
            id,
            title
          ),
          product_price (
            price,
            sale_price
          )
        `);

      // Set data
      setOrderId(returnData.order_id);
      setReason(returnData.reason || '');
      setDocumentType(returnData.customer_document_type_id?.toString() || '');
      setDocumentNumber(returnData.customer_document_number);
      setShippingReturn(returnData.shipping_return);
      setSituationId(returnData.situation_id.toString());
      setSelectedReturnType(returnData.return_type_id.toString());
      setReturnTypeCode(returnData.types?.code || '');
      setOrderProducts(orderProductsData || []);
      setProducts(productsData || []);
      setDocumentTypes(docTypesData || []);

      // Set return products based on return type
      if (returnData.types?.code === 'DVT') {
        // For total return, all order products are automatically returned
        const allOrderProducts = orderProductsData?.map(op => ({
          product_variation_id: op.product_variation_id,
          quantity: op.quantity,
          product_name: op.variations.products.title,
          sku: op.variations.sku,
          price: op.product_price,
          output: true
        })) || [];
        setReturnProducts(allOrderProducts);
      } else {
        // For partial return or exchange, load the selected products
        const formattedReturnProducts = returnProductsData?.filter(rp => rp.output).map(rp => ({
          product_variation_id: rp.product_variation_id,
          quantity: rp.quantity,
          product_name: rp.variations.products.title,
          sku: rp.variations.sku,
          price: rp.product_amount || 0,
          output: rp.output
        })) || [];
        setReturnProducts(formattedReturnProducts);
      }

      // If it's an exchange, load the new products (they would be returns_products with output=false)
      if (returnData.types?.code === 'CAM') {
        const newProds = returnProductsData?.filter(rp => !rp.output).map(rp => {
          const variation = productsData?.find(p => p.id === rp.product_variation_id);
          return {
            variation_id: rp.product_variation_id,
            product_name: variation?.products?.title || '',
            variation_name: variation?.sku || '',
            quantity: rp.quantity,
            price: rp.product_amount || 0,
            discount: 0
          };
        }) || [];
        setNewProducts(newProds);
      }

    } catch (error: any) {
      console.error('Error loading return:', error);
      toast.error('Error al cargar la devolución');
      navigate('/returns');
    } finally {
      setLoading(false);
    }
  };

  const allVariations = useMemo(() => {
    return products.map(variation => ({
      value: variation.id.toString(),
      label: `${variation.products?.title || 'Sin nombre'} - ${variation.sku || 'Sin SKU'}`,
      price: variation.product_price?.[0]?.sale_price || variation.product_price?.[0]?.price || 0,
      product_name: variation.products?.title || 'Sin nombre',
      variation_name: variation.sku || 'Sin SKU'
    }));
  }, [products]);

  const filteredVariations = useMemo(() => {
    if (!searchQuery) return allVariations;
    const query = searchQuery.toLowerCase();
    return allVariations.filter(v => 
      v.label.toLowerCase().includes(query)
    );
  }, [allVariations, searchQuery]);

  const addReturnProduct = (orderProduct: OrderProduct) => {
    const existingProduct = returnProducts.find(
      rp => rp.product_variation_id === orderProduct.product_variation_id
    );

    if (existingProduct) {
      toast.error('Este producto ya fue agregado');
      return;
    }

    const newReturnProduct: ReturnProduct = {
      product_variation_id: orderProduct.product_variation_id,
      quantity: 1,
      product_name: orderProduct.variations.products.title,
      sku: orderProduct.variations.sku,
      price: orderProduct.product_price,
      output: true
    };

    setReturnProducts([...returnProducts, newReturnProduct]);
  };

  const removeReturnProduct = (index: number) => {
    setReturnProducts(returnProducts.filter((_, i) => i !== index));
  };

  const updateReturnProductQuantity = (index: number, quantity: number) => {
    const orderProduct = orderProducts.find(
      op => op.product_variation_id === returnProducts[index].product_variation_id
    );
    
    if (orderProduct && quantity > orderProduct.quantity) {
      toast.error(`La cantidad no puede exceder ${orderProduct.quantity}`);
      return;
    }

    const updated = [...returnProducts];
    updated[index].quantity = quantity;
    setReturnProducts(updated);
  };

  const addNewProduct = () => {
    if (!selectedVariation) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    const existingProduct = newProducts.find(
      np => np.variation_id === Number(selectedVariation.value)
    );

    if (existingProduct) {
      toast.error('Este producto ya fue agregado');
      return;
    }

    const newProduct: NewProduct = {
      variation_id: Number(selectedVariation.value),
      product_name: selectedVariation.product_name,
      variation_name: selectedVariation.variation_name,
      quantity: 1,
      price: selectedVariation.price,
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

  const updateNewProductQuantity = (index: number, quantity: number) => {
    const updated = [...newProducts];
    updated[index].quantity = quantity;
    setNewProducts(updated);
  };

  const updateNewProductDiscount = (index: number, discount: number) => {
    const updated = [...newProducts];
    updated[index].discount = discount;
    setNewProducts(updated);
  };

  const calculateTotals = () => {
    let returnTotal = 0;

    if (returnTypeCode === 'DVT') {
      // For total return, sum all order products
      returnTotal = orderProducts.reduce((sum, product) => {
        return sum + (product.product_price * product.quantity);
      }, 0);
    } else {
      // For partial return or exchange, sum selected products
      returnTotal = returnProducts.reduce((sum, product) => {
        return sum + (product.price * product.quantity);
      }, 0);
    }

    const newTotal = newProducts.reduce((sum, product) => {
      return sum + ((product.price - product.discount) * product.quantity);
    }, 0);

    return {
      returnTotal,
      newTotal,
      difference: newTotal - returnTotal
    };
  };

  const handleSave = async () => {
    // Validation based on return type
    if (returnTypeCode === 'DVP' && returnProducts.length === 0) {
      toast.error('Debe agregar al menos un producto a devolver');
      return;
    }

    if (!situationId) {
      toast.error('Debe seleccionar una situación');
      return;
    }

    if (returnTypeCode === 'CAM') {
      if (returnProducts.length === 0) {
        toast.error('Debe seleccionar productos a devolver');
        return;
      }
      if (newProducts.length === 0) {
        toast.error('Debe agregar productos de cambio');
        return;
      }
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const totals = calculateTotals();
      
      // Update return
      const { error: returnError } = await supabase
        .from('returns')
        .update({
          order_id: orderId,
          return_type_id: Number(selectedReturnType),
          customer_document_type_id: documentType ? Number(documentType) : null,
          customer_document_number: documentNumber,
          reason: reason || null,
          shipping_return: shippingReturn,
          situation_id: Number(situationId),
          status_id: situations.find(s => s.id === Number(situationId))?.status_id,
          total_refund_amount: (returnTypeCode === 'DVT' || returnTypeCode === 'DVP') ? totals.returnTotal : null,
          total_exchange_difference: returnTypeCode === 'CAM' ? totals.difference : null,
        })
        .eq('id', Number(id));

      if (returnError) throw returnError;

      // Delete existing return products
      const { error: deleteError } = await supabase
        .from('returns_products')
        .delete()
        .eq('return_id', Number(id));

      if (deleteError) throw deleteError;

      // Prepare return products based on type
      let returnProductsToInsert = [];
      
      if (returnTypeCode === 'DVT') {
        // For total return, insert all order products
        returnProductsToInsert = orderProducts.map(p => ({
          return_id: Number(id),
          product_variation_id: p.product_variation_id,
          quantity: p.quantity,
          product_amount: p.product_price,
          output: true
        }));
      } else {
        // For partial return or exchange, insert selected products
        returnProductsToInsert = returnProducts.map(product => ({
          return_id: Number(id),
          product_variation_id: product.product_variation_id,
          quantity: product.quantity,
          product_amount: product.price,
          output: true
        }));
      }

      const { error: insertReturnError } = await (supabase as any)
        .from('returns_products')
        .insert(returnProductsToInsert);

      if (insertReturnError) throw insertReturnError;

      // If exchange, insert new products (output = false)
      if (returnTypeCode === 'CAM' && newProducts.length > 0) {
        const newProductsToInsert = newProducts.map(product => ({
          return_id: Number(id),
          product_variation_id: product.variation_id,
          quantity: product.quantity,
          product_amount: product.price - product.discount,
          output: false
        }));

        const { error: insertNewError } = await (supabase as any)
          .from('returns_products')
          .insert(newProductsToInsert);

        if (insertNewError) throw insertNewError;
      }

      // Check if situation has status "CFM" to update stock
      const selectedSituation = situations.find(s => s.id === Number(situationId));
      if (selectedSituation) {
        const { data: statusData } = await supabase
          .from('statuses')
          .select('code')
          .eq('id', selectedSituation.status_id)
          .single();

        if (statusData?.code === 'CFM') {
          // Prepare all products for stock movements
          let allReturnProducts = [];
          
          if (returnTypeCode === 'DVT') {
            // For total return, use all order products
            allReturnProducts = orderProducts.map(p => ({
              product_variation_id: p.product_variation_id,
              quantity: p.quantity,
              output: false
            }));
          } else {
            // For partial return or exchange, use selected products
            allReturnProducts = returnProducts.map(p => ({
              product_variation_id: p.product_variation_id,
              quantity: p.quantity,
              output: false
            }));
          }

          // Add new products for exchanges
          if (returnTypeCode === 'CAM' && newProducts.length > 0) {
            allReturnProducts = [
              ...allReturnProducts,
              ...newProducts.map(p => ({
                product_variation_id: p.variation_id,
                quantity: p.quantity,
                output: true
              }))
            ];
          }

          // Create stock movements and update stock
          for (const product of allReturnProducts) {
            // Get movement type for returns
            const { data: returnMovementType } = await supabase
              .from('types')
              .select('id')
              .eq('module_id', 3) // Stock movements module
              .limit(1)
              .single();

            // Create stock movement
            const { error: movementError } = await (supabase as any)
              .from('stock_movements')
              .insert({
                product_variation_id: product.product_variation_id,
                quantity: product.output ? -product.quantity : product.quantity,
                created_by: user.id,
                movement_type: returnMovementType?.id || 1,
                warehouse_id: 1,
                completed: true,
              });

            if (movementError) {
              console.error('Error creating stock movement:', movementError);
            }

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

      toast.success('Devolución actualizada exitosamente');
      navigate('/returns');
    } catch (error: any) {
      console.error('Error updating return:', error);
      toast.error('Error al actualizar la devolución');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/returns')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Devolución/Cambio</h1>
        <p className="text-muted-foreground mt-1">
          Modifica la información de la devolución o cambio
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Seleccionar tipo" />
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
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="returnType">Tipo de Devolución/Cambio</Label>
              <Select value={selectedReturnType} onValueChange={(value) => {
                setSelectedReturnType(value);
                const type = returnTypes.find(t => t.id.toString() === value);
                setReturnTypeCode(type?.code || '');
              }}>
                <SelectTrigger id="returnType">
                  <SelectValue placeholder="Seleccionar tipo" />
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
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa el motivo de la devolución/cambio"
              />
            </div>

            <div>
              <Label htmlFor="situation">Situación *</Label>
              <Select value={situationId} onValueChange={setSituationId}>
                <SelectTrigger id="situation">
                  <SelectValue placeholder="Seleccionar situación" />
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

            <div className="flex items-center space-x-2">
              <Switch
                id="shippingReturn"
                checked={shippingReturn}
                onCheckedChange={setShippingReturn}
              />
              <Label htmlFor="shippingReturn">Envío a devolver</Label>
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
              <div className="space-y-4">
                <div>
                  <Label>Productos de la Orden</Label>
                  <div className="border rounded-lg mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.variations.products.title}</TableCell>
                            <TableCell>{product.variations.sku}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>${product.product_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addReturnProduct(product)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {returnProducts.length > 0 && (
                  <div>
                    <Label>Productos a Devolver</Label>
                    <div className="border rounded-lg mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio Unitario</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnProducts.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>{product.product_name}</TableCell>
                              <TableCell>{product.sku}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => updateReturnProductQuantity(index, Number(e.target.value))}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>${product.price.toFixed(2)}</TableCell>
                              <TableCell>${(product.price * product.quantity).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeReturnProduct(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {returnTypeCode === 'CAM' && (
          <Card>
            <CardHeader>
              <CardTitle>Productos de Cambio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Buscar Producto</Label>
                <div className="flex gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="flex-1 justify-between"
                      >
                        {selectedVariation ? selectedVariation.label : "Seleccionar producto..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar producto..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No se encontraron productos.</CommandEmpty>
                          <CommandGroup>
                            {filteredVariations.map((variation) => (
                              <CommandItem
                                key={variation.value}
                                value={variation.value}
                                onSelect={() => {
                                  setSelectedVariation(variation);
                                  setOpen(false);
                                }}
                              >
                                {variation.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button onClick={addNewProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {newProducts.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variación</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
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
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateNewProductQuantity(index, Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={product.discount}
                              onChange={(e) => updateNewProductDiscount(index, Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            ${((product.price - product.discount) * product.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNewProduct(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total a Devolver:</span>
                <span className="font-medium">${totals.returnTotal.toFixed(2)}</span>
              </div>
              {returnTypeCode === 'CAM' && (
                <>
                  <div className="flex justify-between">
                    <span>Total Productos Nuevos:</span>
                    <span className="font-medium">${totals.newTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Diferencia:</span>
                    <span className={totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${Math.abs(totals.difference).toFixed(2)}
                      {totals.difference >= 0 ? ' (A favor del cliente)' : ' (A pagar)'}
                    </span>
                  </div>
                </>
              )}
              {returnTypeCode === 'DEV' && (
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a Reembolsar:</span>
                  <span className="text-green-600">${totals.returnTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/returns')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditReturn;
