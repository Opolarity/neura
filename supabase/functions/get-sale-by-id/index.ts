import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get variation details for products
    const variationIds = (order.order_products || []).map((p: any) => p.product_variation_id);
    
    let variations: any[] = [];
    let products: any[] = [];
    let variationTerms: any[] = [];
    let terms: any[] = [];

    if (variationIds.length > 0) {
      const { data: variationsData } = await supabase
        .from("variations")
        .select("id, sku, product_id")
        .in("id", variationIds);
      variations = variationsData || [];

      // 3. Get product titles
      const productIds = [...new Set(variations.map((v) => v.product_id))];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, title")
          .in("id", productIds);
        products = productsData || [];
      }

      // 4. Get variation terms
      const { data: variationTermsData } = await supabase
        .from("variation_terms")
        .select("product_variation_id, term_id")
        .in("product_variation_id", variationIds);
      variationTerms = variationTermsData || [];

      const termIds = [...new Set(variationTerms.map((vt) => vt.term_id))];
      if (termIds.length > 0) {
        const { data: termsData } = await supabase
          .from("terms")
          .select("id, name")
          .in("id", termIds);
        terms = termsData || [];
      }
    }

    // 5. Fetch ALL payments (not just one)
    const { data: payments } = await supabase
      .from("order_payment")
      .select("*")
      .eq("order_id", parseInt(orderId));

    // 6. Fetch current situation with status code
    const { data: situation } = await supabase
      .from("order_situations")
      .select("situation_id, status_id, statuses(code)")
      .eq("order_id", parseInt(orderId))
      .eq("last_row", true)
      .maybeSingle();

    // 7. Get stock types for the products
    const stockMovementIds = (order.order_products || [])
      .map((p: any) => p.stock_movement_id)
      .filter((id: number) => id && id > 0);

    let stockMovements: any[] = [];
    if (stockMovementIds.length > 0) {
      const { data: stockMovementsData } = await supabase
        .from("stock_movements")
        .select("id, stock_type_id")
        .in("id", stockMovementIds);
      stockMovements = stockMovementsData || [];

      // Get stock type names
      const stockTypeIds = [...new Set(stockMovements.map((sm) => sm.stock_type_id).filter(Boolean))];
      if (stockTypeIds.length > 0) {
        const { data: stockTypesData } = await supabase
          .from("types")
          .select("id, name")
          .in("id", stockTypeIds);
        
        const stockTypesMap = new Map((stockTypesData || []).map((st) => [st.id, st.name]));
        stockMovements = stockMovements.map((sm) => ({
          ...sm,
          stock_type_name: stockTypesMap.get(sm.stock_type_id) || "",
        }));
      }
    }

    // 8. Fetch actual current stock for each product variation
    const warehouseId = order.order_products?.[0]?.warehouses_id;
    let productStockMap = new Map<string, number>();
    if (variationIds.length > 0 && warehouseId) {
      // Build unique keys: variationId_stockTypeId
      const stockMovementsMap2 = new Map(stockMovements.map((sm) => [sm.id, sm]));
      const stockTypeIdsForQuery = (order.order_products || []).map((op: any) => {
        const sm = stockMovementsMap2.get(op.stock_movement_id);
        return sm?.stock_type_id || 1;
      });
      const uniqueStockTypeIds = [...new Set(stockTypeIdsForQuery)];

      const { data: stockData } = await supabase
        .from("product_stock")
        .select("product_variation_id, stock, stock_type_id")
        .in("product_variation_id", variationIds)
        .eq("warehouse_id", warehouseId)
        .in("stock_type_id", uniqueStockTypeIds);

      (stockData || []).forEach((s: any) => {
        const key = `${s.product_variation_id}_${s.stock_type_id}`;
        productStockMap.set(key, s.stock);
      });
    }

    // Build response with enriched product data
    const productsMap = new Map(products.map((p) => [p.id, p.title]));
    const variationsMap = new Map(variations.map((v) => [v.id, v]));
    const termsMap = new Map(terms.map((t) => [t.id, t.name]));
    const stockMovementsMap = new Map(stockMovements.map((sm) => [sm.id, sm]));

    const termsByVariation = new Map<number, string[]>();
    variationTerms.forEach((vt) => {
      const termName = termsMap.get(vt.term_id);
      if (termName) {
        const arr = termsByVariation.get(vt.product_variation_id) || [];
        arr.push(termName);
        termsByVariation.set(vt.product_variation_id, arr);
      }
    });

    const enrichedProducts = (order.order_products || []).map((op: any) => {
      const variation = variationsMap.get(op.product_variation_id);
      const productTitle = variation ? productsMap.get(variation.product_id) : "";
      const variationTermNames = termsByVariation.get(op.product_variation_id) || [];
      const stockMovement = stockMovementsMap.get(op.stock_movement_id);

      // Discount amount is stored as total in DB, convert to per-unit
      const discountPerUnit = op.quantity > 0 
        ? parseFloat(op.product_discount) / op.quantity 
        : 0;

      const stockTypeId = stockMovement?.stock_type_id || 1;
      const stockKey = `${op.product_variation_id}_${stockTypeId}`;
      const currentStock = productStockMap.get(stockKey) ?? op.quantity;

      return {
        variation_id: op.product_variation_id,
        product_name: productTitle || op.product_name || "",
        variation_name: variationTermNames.join(" / ") || variation?.sku || "",
        sku: variation?.sku || "",
        quantity: op.quantity,
        price: parseFloat(op.product_price),
        discount_amount: Math.round(discountPerUnit * 100) / 100,
        stock_type_id: stockTypeId,
        stock_type_name: stockMovement?.stock_type_name || "",
        max_stock: currentStock,
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
        total: order.total,
      },
      products: enrichedProducts,
      payments: (payments || []).map((p: any) => ({
        id: p.id,
        payment_method_id: p.payment_method_id,
        amount: p.amount,
        confirmation_code: p.gateway_confirmation_code,
        voucher_url: p.voucher_url,
      })),
      current_situation: situation,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-sale-by-id:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
