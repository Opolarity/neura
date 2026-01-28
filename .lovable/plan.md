

## Plan: Edge Function para Obtener Detalle de Venta (get-sale-by-id)

Este plan crea un Edge Function que consolida toda la información necesaria para editar una venta en una sola llamada.

### Resumen

Crear un nuevo Edge Function `get-sale-by-id` que retorne todos los datos necesarios para pre-llenar el formulario `CreateSale.tsx` cuando se edita una venta existente.

---

### Datos a Retornar

El Edge Function debe retornar un objeto con esta estructura:

```json
{
  "order": {
    "id": 123,
    "date": "2026-01-28",
    "document_type": 1,
    "document_number": "12345678",
    "customer_name": "Juan",
    "customer_lastname": "Pérez",
    "email": "juan@email.com",
    "phone": "999888777",
    "sale_type_id": 1,
    "shipping_method_code": "DELIVERY",
    "shipping_cost": 10.00,
    "country_id": 1,
    "state_id": 1,
    "city_id": 1,
    "neighborhood_id": 1,
    "address": "Av. Principal 123",
    "address_reference": "Cerca al parque",
    "reception_person": "María García",
    "reception_phone": "999777666",
    "subtotal": 150.00,
    "discount": 10.00,
    "total": 150.00
  },
  "products": [
    {
      "variation_id": 456,
      "product_name": "Camiseta Negra",
      "variation_name": "Negro / M",
      "sku": "CAM-NEG-M",
      "quantity": 2,
      "price": 50.00,
      "discount_amount": 5.00,
      "stock_type_id": 1,
      "stock_type_name": "Disponible",
      "max_stock": 100
    }
  ],
  "payments": [
    {
      "id": 789,
      "payment_method_id": 1,
      "amount": 100.00,
      "confirmation_code": "ABC123",
      "voucher_url": "https://..."
    },
    {
      "id": 790,
      "payment_method_id": 2,
      "amount": 50.00,
      "confirmation_code": null,
      "voucher_url": null
    }
  ],
  "current_situation": {
    "situation_id": 2,
    "status_id": 1
  }
}
```

---

### Paso 1: Crear Edge Function

**Archivo:** `supabase/functions/get-sale-by-id/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch order with products
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_products (
          id,
          product_variation_id,
          quantity,
          product_price,
          product_discount,
          product_name,
          warehouses_id,
          stock_movement_id
        )
      `)
      .eq("id", parseInt(orderId))
      .single();

    if (orderError) throw orderError;

    // 2. Get variation details for products
    const variationIds = order.order_products.map(p => p.product_variation_id);
    const { data: variations } = await supabase
      .from("variations")
      .select("id, sku, product_id")
      .in("id", variationIds);

    // 3. Get product titles
    const productIds = [...new Set(variations?.map(v => v.product_id) || [])];
    const { data: products } = await supabase
      .from("products")
      .select("id, title")
      .in("id", productIds);

    // 4. Get variation terms
    const { data: variationTerms } = await supabase
      .from("variation_terms")
      .select("product_variation_id, term_id")
      .in("product_variation_id", variationIds);

    const termIds = [...new Set(variationTerms?.map(vt => vt.term_id) || [])];
    const { data: terms } = await supabase
      .from("terms")
      .select("id, name")
      .in("id", termIds);

    // 5. Fetch ALL payments (not just one)
    const { data: payments } = await supabase
      .from("order_payment")
      .select("*")
      .eq("order_id", parseInt(orderId));

    // 6. Fetch current situation
    const { data: situation } = await supabase
      .from("order_situations")
      .select("situation_id, status_id")
      .eq("order_id", parseInt(orderId))
      .eq("last_row", true)
      .maybeSingle();

    // 7. Get stock types for the products
    const { data: stockMovements } = await supabase
      .from("stock_movements")
      .select("id, stock_type_id, types:stock_type_id(id, name)")
      .in("id", order.order_products.map(p => p.stock_movement_id));

    // Build response with enriched product data
    const productsMap = new Map(products?.map(p => [p.id, p.title]) || []);
    const variationsMap = new Map(variations?.map(v => [v.id, v]) || []);
    const termsMap = new Map(terms?.map(t => [t.id, t.name]) || []);
    const stockMovementsMap = new Map(stockMovements?.map(sm => [sm.id, sm]) || []);
    
    const termsByVariation = new Map();
    variationTerms?.forEach(vt => {
      const termName = termsMap.get(vt.term_id);
      if (termName) {
        const arr = termsByVariation.get(vt.product_variation_id) || [];
        arr.push(termName);
        termsByVariation.set(vt.product_variation_id, arr);
      }
    });

    const enrichedProducts = order.order_products.map(op => {
      const variation = variationsMap.get(op.product_variation_id);
      const productTitle = variation ? productsMap.get(variation.product_id) : "";
      const variationTerms = termsByVariation.get(op.product_variation_id) || [];
      const stockMovement = stockMovementsMap.get(op.stock_movement_id);
      
      return {
        variation_id: op.product_variation_id,
        product_name: productTitle || op.product_name || "",
        variation_name: variationTerms.join(" / ") || variation?.sku || "",
        sku: variation?.sku || "",
        quantity: op.quantity,
        price: parseFloat(op.product_price),
        discount_amount: parseFloat(op.product_discount),
        stock_type_id: stockMovement?.stock_type_id || 1,
        stock_type_name: stockMovement?.types?.name || "",
        max_stock: op.quantity // For editing, allow at least current quantity
      };
    });

    const response = {
      order: {
        id: order.id,
        date: order.date,
        document_type: order.document_type,
        document_number: order.document_number,
        customer_name: order.customer_name,
        customer_lastname: order.customer_lastname,
        email: order.email,
        phone: order.phone,
        sale_type_id: order.sale_type_id,
        shipping_method_code: order.shipping_method_code,
        shipping_cost: order.shipping_cost,
        country_id: order.country_id,
        state_id: order.state_id,
        city_id: order.city_id,
        neighborhood_id: order.neighborhood_id,
        address: order.address,
        address_reference: order.address_reference,
        reception_person: order.reception_person,
        reception_phone: order.reception_phone,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total
      },
      products: enrichedProducts,
      payments: payments || [],
      current_situation: situation
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

---

### Paso 2: Actualizar config.toml

```toml
[functions.get-sale-by-id]
verify_jwt = false
```

---

### Paso 3: Crear Service

**Archivo:** Agregar a `src/modules/sales/services/index.ts`

```typescript
export const fetchSaleById = async (orderId: number) => {
  const { data, error } = await supabase.functions.invoke(
    `get-sale-by-id?id=${orderId}`
  );
  if (error) throw error;
  return data;
};
```

---

### Paso 4: Crear Adapter

**Agregar a** `src/modules/sales/adapters/index.ts`

```typescript
export const adaptSaleById = (data: any) => ({
  formData: {
    documentType: data.order.document_type?.toString() || "",
    documentNumber: data.order.document_number || "",
    customerName: data.order.customer_name || "",
    customerLastname: data.order.customer_lastname || "",
    customerLastname2: "",
    email: data.order.email || "",
    phone: data.order.phone?.toString() || "",
    saleType: data.order.sale_type_id?.toString() || "",
    priceListId: "",
    saleDate: data.order.date?.split("T")[0] || "",
    vendorName: "",
    shippingMethod: data.order.shipping_method_code || "",
    shippingCost: data.order.shipping_cost?.toString() || "",
    countryId: data.order.country_id?.toString() || "",
    stateId: data.order.state_id?.toString() || "",
    cityId: data.order.city_id?.toString() || "",
    neighborhoodId: data.order.neighborhood_id?.toString() || "",
    address: data.order.address || "",
    addressReference: data.order.address_reference || "",
    receptionPerson: data.order.reception_person || "",
    receptionPhone: data.order.reception_phone?.toString() || "",
    withShipping: !!data.order.shipping_method_code,
    employeeSale: false,
    notes: "",
  },
  products: data.products.map((p: any) => ({
    variationId: p.variation_id,
    productName: p.product_name,
    variationName: p.variation_name,
    sku: p.sku,
    quantity: p.quantity,
    price: p.price,
    discountAmount: p.discount_amount,
    stockTypeId: p.stock_type_id,
    stockTypeName: p.stock_type_name,
    maxStock: p.max_stock,
  })),
  payments: data.payments.map((p: any) => ({
    id: crypto.randomUUID(),
    paymentMethodId: p.payment_method_id?.toString() || "",
    amount: p.amount?.toString() || "",
    confirmationCode: p.gateway_confirmation_code || "",
    voucherUrl: p.voucher_url || "",
    voucherPreview: p.voucher_url || undefined,
  })),
  currentSituation: data.current_situation?.situation_id?.toString() || "",
});
```

---

### Paso 5: Actualizar useCreateSale.ts

Reemplazar la función `loadOrderData` para usar el nuevo Edge Function:

```typescript
const loadOrderData = async (id: number) => {
  try {
    setLoading(true);
    
    // Single call to get all data
    const data = await fetchSaleById(id);
    const adapted = adaptSaleById(data);
    
    // Set all state at once
    setFormData(adapted.formData);
    setProducts(adapted.products);
    setPayments(adapted.payments.length > 0 
      ? adapted.payments 
      : [createEmptyPayment()]);
    setOrderSituation(adapted.currentSituation);
    setClientFound(true);
    setCreatedOrderId(id);
    
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
```

---

### Paso 6: Eliminar llamadas redundantes en services

Una vez implementado, se pueden eliminar o deprecar:
- `fetchOrderById` (reemplazado por `fetchSaleById`)
- `fetchVariationsByIds` (usado solo para edición)
- `fetchProductsByIds` (usado solo para edición)
- `fetchVariationTerms` (usado solo para edición)
- `fetchTermsByIds` (usado solo para edición)
- `fetchOrderPayment` (integrado en `fetchSaleById`)
- `fetchOrderSituation` (integrado en `fetchSaleById`)

---

### Beneficios

| Antes | Después |
|-------|---------|
| 7+ llamadas API separadas | 1 sola llamada |
| Lógica de transformación en frontend | Datos ya estructurados desde backend |
| Múltiples roundtrips de red | Un solo roundtrip |
| Solo traía 1 pago | Trae TODOS los pagos |
| Stock type no se recuperaba | Incluye stock_type_id y nombre |

---

### Orden de Implementación

1. Crear Edge Function `get-sale-by-id/index.ts`
2. Actualizar `supabase/config.toml`
3. Agregar `fetchSaleById` a services
4. Agregar `adaptSaleById` a adapters
5. Actualizar `loadOrderData` en `useCreateSale.ts`
6. Probar el flujo de edición completo
7. (Opcional) Limpiar funciones de servicio obsoletas

