import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Plus, Trash2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: number;
  document_number: string;
  customer_name: string;
  customer_lastname: string;
  total: number;
  created_at: string;
  document_type: number;
  shipping_cost: number | null;
}

interface OrderProduct {
  id: number;
  product_variation_id: number;
  quantity: number;
  product_price: number;
  product_discount: number;
  product_name: string;
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
  maxQuantity: number;
}

interface ExchangeProduct {
  variation_id: number;
  product_name: string;
  variation_name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  linked_return_index: number | null;
}

interface ReturnType {
  id: number;
  name: string;
  code: string;
}

interface Situation {
  id: number;
  name: string;
  code: string;
  status_id: number;
}

const CreateReturn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnTypes, setReturnTypes] = useState<ReturnType[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturnType, setSelectedReturnType] = useState<string>("");
  const [returnTypeCode, setReturnTypeCode] = useState<string>("");
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [moduleId, setModuleId] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form fields
  const [reason, setReason] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [shippingReturn, setShippingReturn] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [situationId, setSituationId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
  const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>([]);

  // Product search for exchanges
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [open, setOpen] = useState(false);

  // Order search and pagination
  const [orderSearch, setOrderSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Get user profile for warehouse and branch
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, branches(*)")
        .eq("UID", user.id)
        .single();

      setUserProfile(profileData);

      // Get all orders for the current user
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, document_number, customer_name, customer_lastname, total, created_at, document_type, shipping_cost")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get returns to exclude orders that already have a return/exchange
      const { data: returnsData } = await supabase
        .from("returns")
        .select("order_id");

      const returnedOrderIds = new Set((returnsData || []).map((r: any) => r.order_id));
      const availableOrders = (ordersData || []).filter(
        (order) => !returnedOrderIds.has(order.id)
      );

      // Get return types from module "RTU"
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "RTU")
        .single();

      if (moduleError) throw moduleError;
      setModuleId(moduleData.id);

      const { data: typesData } = await supabase
        .from("types")
        .select("*")
        .eq("module_id", moduleData.id);

      // Get situations from module "RTU" with status info
      const { data: situationsData } = await supabase
        .from("situations")
        .select("*, statuses(id, code, name)")
        .eq("module_id", moduleData.id);

      // Get document types
      const { data: docTypesData } = await supabase
        .from("document_types")
        .select("*");

      // Get payment methods
      const { data: paymentMethodsData } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("active", true);

      // Get products for exchange section
      const { data: productsData } = await supabase.functions.invoke("get-products-list");

      setOrders(availableOrders);
      setReturnTypes(typesData || []);
      setSituations(
        (situationsData || []).map((s: any) => ({
          ...s,
          code: s.code || s.statuses?.code,
          status_id: s.status_id,
        }))
      );
      setDocumentTypes(docTypesData || []);
      setPaymentMethods(paymentMethodsData || []);
      setProducts(productsData?.products || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = async () => {
    if (!selectedOrder || !selectedReturnType) {
      toast.error("Debe seleccionar una orden y un tipo de devolución");
      return;
    }

    const selectedType = returnTypes.find((t) => t.id === parseInt(selectedReturnType));
    setReturnTypeCode(selectedType?.code || "");

    // Load order products
    const { data: orderProductsData, error } = await supabase
      .from("order_products")
      .select(`
        *,
        variations (
          sku,
          products (
            title
          )
        )
      `)
      .eq("order_id", selectedOrder.id);

    if (error) {
      console.error("Error loading order products:", error);
      toast.error("Error al cargar los productos de la orden");
      return;
    }

    setOrderProducts(orderProductsData || []);
    setDocumentType(selectedOrder.document_type.toString());
    setDocumentNumber(selectedOrder.document_number);
    setShippingCost(selectedOrder.shipping_cost || 0);

    // For DVT (Total Return), automatically add all products
    if (selectedType?.code === "DVT") {
      const allProducts: ReturnProduct[] = (orderProductsData || []).map((p: OrderProduct) => ({
        product_variation_id: p.product_variation_id,
        quantity: p.quantity,
        product_name: p.variations.products.title,
        sku: p.variations.sku,
        price: p.product_price * (1 - p.product_discount / 100),
        output: false,
        maxQuantity: p.quantity,
      }));
      setReturnProducts(allProducts);
    }

    setShowOrderModal(false);
  };

  // Filter and paginate orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
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
      const sku = variation.sku?.toLowerCase() || "";
      const termsNames = variation.terms?.map((t: any) => t.terms.name.toLowerCase()).join(" ") || "";
      return productTitle.includes(query) || sku.includes(query) || termsNames.includes(query);
    });
  }, [allVariations, searchQuery]);

  const toggleReturnProduct = (product: OrderProduct, quantity: number) => {
    const existing = returnProducts.find(
      (p) => p.product_variation_id === product.product_variation_id
    );

    if (quantity === 0 && existing) {
      setReturnProducts(
        returnProducts.filter((p) => p.product_variation_id !== product.product_variation_id)
      );
    } else if (quantity > 0) {
      const newProduct: ReturnProduct = {
        product_variation_id: product.product_variation_id,
        quantity,
        product_name: product.variations.products.title,
        sku: product.variations.sku,
        price: product.product_price * (1 - product.product_discount / 100),
        output: false,
        maxQuantity: product.quantity,
      };

      if (existing) {
        setReturnProducts(
          returnProducts.map((p) =>
            p.product_variation_id === product.product_variation_id ? newProduct : p
          )
        );
      } else {
        setReturnProducts([...returnProducts, newProduct]);
      }
    }
  };

  const addExchangeProduct = () => {
    if (!selectedVariation) {
      toast.error("Debe seleccionar un producto");
      return;
    }

    const termsNames = selectedVariation.terms?.map((t: any) => t.terms.name).join(" - ") || "";
    const newProduct: ExchangeProduct = {
      variation_id: selectedVariation.id,
      product_name: selectedVariation.product_title,
      variation_name: termsNames,
      sku: selectedVariation.sku || "",
      quantity: 1,
      price: selectedVariation.prices?.[0]?.price || 0,
      discount: 0,
      linked_return_index: null,
    };

    setExchangeProducts([...exchangeProducts, newProduct]);
    setSelectedVariation(null);
    setSearchQuery("");
    setOpen(false);
  };

  const removeExchangeProduct = (index: number) => {
    setExchangeProducts(exchangeProducts.filter((_, i) => i !== index));
  };

  const updateExchangeProduct = (index: number, field: string, value: any) => {
    setExchangeProducts(
      exchangeProducts.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const calculateReturnTotal = () => {
    return returnProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  };

  const calculateExchangeTotal = () => {
    return exchangeProducts.reduce((sum, p) => {
      const discountedPrice = p.price * (1 - p.discount / 100);
      return sum + discountedPrice * p.quantity;
    }, 0);
  };

  const calculateDifference = () => {
    const returnTotal = calculateReturnTotal();
    const exchangeTotal = calculateExchangeTotal();
    return returnTotal - exchangeTotal;
  };

  const getSelectedSituation = () => {
    return situations.find((s) => s.id === parseInt(situationId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder || !selectedReturnType || !situationId) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    if (!paymentMethodId) {
      toast.error("Seleccione un método de pago");
      return;
    }

    if (returnProducts.length === 0) {
      toast.error("Debe seleccionar al menos un producto a devolver");
      return;
    }

    setSaving(true);

    try {
      const selectedSituation = getSelectedSituation();
      const situationCode = selectedSituation?.code || "VIR";

      let totalRefundAmount = 0;
      let totalExchangeDifference = 0;

      if (returnTypeCode === "DVT" || returnTypeCode === "DVP") {
        totalRefundAmount = calculateReturnTotal();
      } else if (returnTypeCode === "CAM") {
        const difference = calculateDifference();
        if (difference >= 0) {
          totalRefundAmount = difference;
        } else {
          totalExchangeDifference = Math.abs(difference);
        }
      }

      // Build return products array
      const returnProductsPayload = returnProducts.map((p) => ({
        product_variation_id: p.product_variation_id,
        quantity: p.quantity,
        product_amount: p.price,
        output: false,
      }));

      // Build exchange products array with vinculation indexes
      const exchangeProductsPayload = exchangeProducts.map((p) => ({
        product_variation_id: p.variation_id,
        quantity: p.quantity,
        product_amount: p.price * (1 - p.discount / 100),
        output: true,
        vinculated_index: p.linked_return_index,
      }));

      const allProducts = [...returnProductsPayload, ...exchangeProductsPayload];

      const payload = {
        order_id: selectedOrder.id,
        return_type_id: parseInt(selectedReturnType),
        return_type_code: returnTypeCode,
        customer_document_number: documentNumber,
        customer_document_type_id: parseInt(documentType),
        reason,
        shipping_return: shippingReturn,
        shipping_cost: shippingReturn ? shippingCost : 0,
        situation_id: parseInt(situationId),
        situation_code: situationCode,
        status_id: selectedSituation?.status_id || 1,
        module_id: moduleId,
        total_refund_amount: totalRefundAmount,
        total_exchange_difference: totalExchangeDifference,
        return_products: allProducts,
        payment_method_id: parseInt(paymentMethodId),
        business_account_id: paymentMethods.find(pm => pm.id === parseInt(paymentMethodId))?.business_account_id || 1,
        branch_id: userProfile?.branch_id || 1,
        warehouse_id: userProfile?.warehouse_id || 1,
      };

      const { data, error } = await supabase.functions.invoke("create-returns", {
        body: payload,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al crear la devolución");

      toast.success("Devolución/Cambio creado exitosamente");
      navigate("/returns");
    } catch (error: any) {
      console.error("Error creating return:", error);
      toast.error(error.message || "Error al crear la devolución/cambio");
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

  const isDVT = returnTypeCode === "DVT";
  const isCAM = returnTypeCode === "CAM";

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
                    {orderSearch ? "No se encontraron órdenes" : "No hay órdenes disponibles para devolución"}
                  </p>
                ) : (
                  paginatedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? "border-primary bg-primary/5" : "hover:bg-accent"
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
                            <p className="font-medium text-sm">{formatCurrency(order.total)}</p>
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
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/returns")}>
              Cancelar
            </Button>
            <Button
              onClick={handleOrderSelect}
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Devolución/Cambio</h1>
              {returnTypeCode && (
                <Badge variant="outline" className="mt-1">
                  {returnTypes.find(t => t.code === returnTypeCode)?.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/returns")}>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>ID de Orden</Label>
                  <Input value={selectedOrder?.id || ""} disabled />
                </div>
                <div>
                  <Label>Situación *</Label>
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
                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id.toString()}>
                          {pm.name}
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
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shippingReturn}
                    onCheckedChange={setShippingReturn}
                    id="shipping-return"
                  />
                  <Label htmlFor="shipping-return">Devolver el envío</Label>
                </div>
                {shippingReturn && (
                  <div className="flex items-center gap-2">
                    <Label>Costo de envío:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products to Return */}
          <Card>
            <CardHeader>
              <CardTitle>
                Productos a Devolver
                {isDVT && <span className="text-sm font-normal text-muted-foreground ml-2">(Devolución Total - Todos los productos)</span>}
              </CardTitle>
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
                  {orderProducts.map((product) => {
                    const returnProduct = returnProducts.find(
                      (p) => p.product_variation_id === product.product_variation_id
                    );
                    const unitPrice = product.product_price * (1 - product.product_discount / 100);

                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.variations.products.title}</TableCell>
                        <TableCell>{product.variations.sku}</TableCell>
                        <TableCell>{formatCurrency(unitPrice)}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={product.quantity}
                            value={returnProduct?.quantity || 0}
                            onChange={(e) => toggleReturnProduct(product, parseInt(e.target.value) || 0)}
                            className="w-24"
                            disabled={isDVT}
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency((returnProduct?.quantity || 0) * unitPrice)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 text-right">
                <p className="text-lg font-bold">
                  Total a Devolver: {formatCurrency(calculateReturnTotal())}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exchange Products - Only for CAM */}
          {isCAM && (
            <Card>
              <CardHeader>
                <CardTitle>Productos de Cambio (Salida)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={open} className="flex-1 justify-between">
                        {selectedVariation
                          ? `${selectedVariation.product_title} - ${selectedVariation.terms?.map((t: any) => t.terms.name).join(" ")}`
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
                            {filteredVariations.slice(0, 20).map((variation) => (
                              <CommandItem
                                key={variation.id}
                                value={`${variation.product_title} ${variation.sku}`}
                                onSelect={() => setSelectedVariation(variation)}
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
                                    {variation.terms?.map((t: any) => t.terms.name).join(" - ")} - SKU: {variation.sku}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button type="button" onClick={addExchangeProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                {exchangeProducts.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variación</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Descuento %</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Vinculado a</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchangeProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell>{product.variation_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => updateExchangeProduct(index, "price", parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateExchangeProduct(index, "quantity", parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={product.discount}
                              onChange={(e) => updateExchangeProduct(index, "discount", parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {formatCurrency(product.price * (1 - product.discount / 100) * product.quantity)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={product.linked_return_index?.toString() || ""}
                              onValueChange={(v) => updateExchangeProduct(index, "linked_return_index", v ? parseInt(v) : null)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sin vincular" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Sin vincular</SelectItem>
                                {returnProducts.map((rp, rpIndex) => (
                                  <SelectItem key={rpIndex} value={rpIndex.toString()}>
                                    {rp.product_name} (x{rp.quantity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExchangeProduct(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-4 space-y-2 text-right border-t pt-4">
                  <p>Total Productos Devueltos: {formatCurrency(calculateReturnTotal())}</p>
                  <p>Total Productos Cambio: {formatCurrency(calculateExchangeTotal())}</p>
                  <p className="text-lg font-bold">
                    {calculateDifference() >= 0
                      ? `A Reembolsar: ${formatCurrency(calculateDifference())}`
                      : `Diferencia a Pagar: ${formatCurrency(Math.abs(calculateDifference()))}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary for DVT and DVP */}
          {!isCAM && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-right">
                  <p>Total productos a devolver: {formatCurrency(calculateReturnTotal())}</p>
                  {shippingReturn && <p>Costo de envío a devolver: {formatCurrency(shippingCost)}</p>}
                  <p className="text-lg font-bold">
                    Total a Reembolsar: {formatCurrency(calculateReturnTotal() + (shippingReturn ? shippingCost : 0))}
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
