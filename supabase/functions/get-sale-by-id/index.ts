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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_products (
          id, product_variation_id, quantity, product_price,
          product_discount, product_name, warehouses_id, stock_movement_id
        )
      `)
      .eq("id", parseInt(orderId))
      .single();

    if (orderError) throw orderError;
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let priceListId: number | null = null;
    if (order.price_list_code) {
      const { data: priceListData } = await supabase
        .from("price_list").select("id").eq("code", order.price_list_code).single();
      priceListId = priceListData?.id ?? null;
    }

    const variationIds = (order.order_products || []).map((p: any) => p.product_variation_id);
    let variations: any[] = [], products: any[] = [], variationTerms: any[] = [], terms: any[] = [];

    if (variationIds.length > 0) {
      const { data: vd } = await supabase.from("variations").select("id, sku, product_id").in("id", variationIds);
      variations = vd || [];
      const productIds = [...new Set(variations.map((v) => v.product_id))];
      if (productIds.length > 0) {
        const { data: pd } = await supabase.from("products").select("id, title").in("id", productIds);
        products = pd || [];
      }
      const { data: vtd } = await supabase.from("variation_terms").select("product_variation_id, term_id").in("product_variation_id", variationIds);
      variationTerms = vtd || [];
      const termIds = [...new Set(variationTerms.map((vt) => vt.term_id))];
      if (termIds.length > 0) {
        const { data: td } = await supabase.from("terms").select("id, name").in("id", termIds);
        terms = td || [];
      }
    }

    const { data: payments } = await supabase.from("order_payment").select("*").eq("order_id", parseInt(orderId));
    const { data: situation } = await supabase.from("order_situations")
      .select("situation_id, status_id, statuses(code)").eq("order_id", parseInt(orderId)).eq("last_row", true).maybeSingle();

    const stockMovementIds = (order.order_products || []).map((p: any) => p.stock_movement_id).filter((id: number) => id && id > 0);
    let stockMovements: any[] = [];
    if (stockMovementIds.length > 0) {
      const { data: smd } = await supabase.from("stock_movements").select("id, stock_type_id").in("id", stockMovementIds);
      stockMovements = smd || [];
      const stIds = [...new Set(stockMovements.map((sm) => sm.stock_type_id).filter(Boolean))];
      if (stIds.length > 0) {
        const { data: std } = await supabase.from("types").select("id, name").in("id", stIds);
        const stMap = new Map((std || []).map((st) => [st.id, st.name]));
        stockMovements = stockMovements.map((sm) => ({ ...sm, stock_type_name: stMap.get(sm.stock_type_id) || "" }));
      }
    }

    const warehouseId = order.order_products?.[0]?.warehouses_id;
    let productStockMap = new Map<string, number>();
    if (variationIds.length > 0 && warehouseId) {
      const smMap2 = new Map(stockMovements.map((sm) => [sm.id, sm]));
      const stIdsQ = (order.order_products || []).map((op: any) => { const sm = smMap2.get(op.stock_movement_id); return sm?.stock_type_id || 1; });
      const uStIds = [...new Set(stIdsQ)];
      const { data: sd } = await supabase.from("product_stock").select("product_variation_id, stock, stock_type_id")
        .in("product_variation_id", variationIds).eq("warehouse_id", warehouseId).in("stock_type_id", uStIds);
      (sd || []).forEach((s: any) => { productStockMap.set(`${s.product_variation_id}_${s.stock_type_id}`, s.stock); });
    }

    // Fetch order_discounts
    const { data: orderDiscounts } = await supabase.from("order_discounts").select("id, name, discount_amount, code").eq("order_id", parseInt(orderId));

    const productsMap = new Map(products.map((p) => [p.id, p.title]));
    const variationsMap = new Map(variations.map((v) => [v.id, v]));
    const termsMap = new Map(terms.map((t) => [t.id, t.name]));
    const stockMovementsMap = new Map(stockMovements.map((sm) => [sm.id, sm]));
    const termsByVariation = new Map<number, string[]>();
    variationTerms.forEach((vt) => { const tn = termsMap.get(vt.term_id); if (tn) { const a = termsByVariation.get(vt.product_variation_id) || []; a.push(tn); termsByVariation.set(vt.product_variation_id, a); } });

    const enrichedProducts = (order.order_products || []).map((op: any) => {
      const v = variationsMap.get(op.product_variation_id);
      const pt = v ? productsMap.get(v.product_id) : "";
      const vtn = termsByVariation.get(op.product_variation_id) || [];
      const sm = stockMovementsMap.get(op.stock_movement_id);
      const dpu = op.quantity > 0 ? parseFloat(op.product_discount) / op.quantity : 0;
      const stId = sm?.stock_type_id || 1;
      const cs = productStockMap.get(`${op.product_variation_id}_${stId}`) ?? op.quantity;
      return {
        variation_id: op.product_variation_id, product_name: pt || op.product_name || "",
        variation_name: vtn.join(" / ") || v?.sku || "", sku: v?.sku || "",
        quantity: op.quantity, price: parseFloat(op.product_price),
        discount_amount: Math.round(dpu * 100) / 100, stock_type_id: stId,
        stock_type_name: sm?.stock_type_name || "", max_stock: cs,
      };
    });

    const response = {
      order: {
        id: order.id, date: order.date, document_type: order.document_type,
        document_number: order.document_number, customer_name: order.customer_name,
        customer_lastname: order.customer_lastname, email: order.email, phone: order.phone,
        sale_type_id: order.sale_type_id, price_list_code: order.price_list_code,
        price_list_id: priceListId, shipping_method_code: order.shipping_method_code,
        shipping_cost: order.shipping_cost, country_id: order.country_id,
        state_id: order.state_id, city_id: order.city_id,
        neighborhood_id: order.neighborhood_id, address: order.address,
        address_reference: order.address_reference, reception_person: order.reception_person,
        reception_phone: order.reception_phone, subtotal: order.subtotal,
        discount: order.discount, total: order.total, warehouse_id: warehouseId || null,
      },
      products: enrichedProducts,
      payments: (payments || []).filter((p: any) => p.amount >= 0).map((p: any) => ({
        id: p.id, payment_method_id: p.payment_method_id, amount: p.amount,
        confirmation_code: p.gateway_confirmation_code, voucher_url: p.voucher_url,
        business_account_id: p.business_acount_id,
      })),
      change_entries: (payments || []).filter((p: any) => p.amount < 0).map((p: any) => ({
        id: p.id, payment_method_id: p.payment_method_id, amount: Math.abs(p.amount),
        business_account_id: p.business_acount_id,
      })),
      discounts: (orderDiscounts || []).map((d: any) => ({
        id: d.id, name: d.name, discount_amount: d.discount_amount, code: d.code,
      })),
      current_situation: situation,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-sale-by-id:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});