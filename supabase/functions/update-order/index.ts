import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing env vars");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.split(" ")[1];
    if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile, error: profileError } = await supabase.from("profiles").select("branch_id, warehouse_id").eq("UID", user.id).single();
    if (profileError || !profile) return new Response(JSON.stringify({ error: "User profile not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const input = await req.json();
    const orderId = input.order_id;
    if (!orderId) return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: existingOrder, error: orderCheckError } = await supabase.from("orders").select("id, user_id").eq("id", orderId).single();
    if (orderCheckError || !existingOrder) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let stockIsActive = true, stockCompleted = true;
    const { data: currentSituation } = await supabase.from("order_situations").select("situation_id, situations!inner(code)").eq("order_id", orderId).eq("last_row", true).single();
    const currentSituationCode = (currentSituation?.situations as { code: string } | null)?.code;
    if (currentSituationCode) {
      if (currentSituationCode.endsWith("-PHY")) { stockIsActive = true; stockCompleted = true; }
      else if (currentSituationCode.endsWith("-HDN")) { stockIsActive = false; stockCompleted = false; }
      else if (currentSituationCode.endsWith("-VIR")) { stockIsActive = true; stockCompleted = false; }
    }

    const { data: movementType } = await supabase.from("types").select("id, module_id, modules!inner(code)").eq("code", "ORD").eq("modules.code", "STM").single();
    const movementTypeId = movementType?.id || 4;
    const reversalTypeId = movementTypeId;

    // Reverse existing products
    const { data: existingProducts } = await supabase.from("order_products").select("id, product_variation_id, quantity, warehouses_id, stock_movement_id").eq("order_id", orderId);
    for (const product of existingProducts || []) {
      const { data: originalMovement } = await supabase.from("stock_movements").select("stock_type_id, completed").eq("id", product.stock_movement_id).single();
      const originalStockTypeId = originalMovement?.stock_type_id || 9;
      const wasCompleted = originalMovement?.completed || false;
      await supabase.from("stock_movements").insert({ product_variation_id: product.product_variation_id, quantity: product.quantity, warehouse_id: product.warehouses_id, movement_type: reversalTypeId, stock_type_id: originalStockTypeId, is_active: true, completed: true, created_by: user.id, vinculated_movement_id: product.stock_movement_id });
      if (wasCompleted) {
        const { data: es } = await supabase.from("product_stock").select("id, stock").eq("product_variation_id", product.product_variation_id).eq("warehouse_id", product.warehouses_id).eq("stock_type_id", originalStockTypeId).single();
        if (es) await supabase.from("product_stock").update({ stock: es.stock + product.quantity }).eq("id", es.id);
      }
    }
    await supabase.from("order_products").delete().eq("order_id", orderId);

    let priceListCode: string | undefined = undefined;
    if (input.price_list_id) {
      const { data: pld } = await supabase.from("price_list").select("code").eq("id", parseInt(input.price_list_id)).single();
      priceListCode = pld?.code ?? undefined;
    }

    const orderUpdate: Record<string, unknown> = {
      document_type: input.document_type, document_number: input.document_number,
      customer_name: input.customer_name, customer_lastname: input.customer_lastname,
      email: input.email, phone: input.phone ? parseInt(input.phone) : null,
      sale_type_id: input.sale_type, shipping_method_code: input.shipping_method,
      shipping_cost: input.shipping_cost, country_id: input.country_id,
      state_id: input.state_id, city_id: input.city_id, neighborhood_id: input.neighborhood_id,
      address: input.address, address_reference: input.address_reference,
      reception_person: input.reception_person,
      reception_phone: input.reception_phone ? parseInt(input.reception_phone) : null,
      subtotal: input.subtotal, discount: input.discount, total: input.total, change: input.change || 0,
    };
    if (priceListCode !== undefined) orderUpdate.price_list_code = priceListCode;

    const { error: updateError } = await supabase.from("orders").update(orderUpdate).eq("id", orderId);
    if (updateError) return new Response(JSON.stringify({ error: "Failed to update order", details: updateError }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Insert new products
    for (const product of input.products || []) {
      const lineDiscount = product.discount_amount * product.quantity;
      const { data: sm, error: smError } = await supabase.from("stock_movements").insert({
        product_variation_id: product.variation_id, quantity: -product.quantity,
        warehouse_id: profile.warehouse_id, movement_type: movementTypeId,
        stock_type_id: product.stock_type_id, is_active: stockIsActive,
        completed: stockCompleted, created_by: user.id,
      }).select("id").single();
      if (smError) { console.error("Error creating stock movement:", smError); continue; }
      await supabase.from("order_products").insert({
        order_id: orderId, product_variation_id: product.variation_id,
        quantity: product.quantity, product_price: product.price,
        product_discount: lineDiscount, warehouses_id: profile.warehouse_id,
        stock_movement_id: sm?.id || 0,
      });
      if (stockCompleted) {
        const { data: cs } = await supabase.from("product_stock").select("id, stock").eq("product_variation_id", product.variation_id).eq("warehouse_id", profile.warehouse_id).eq("stock_type_id", product.stock_type_id).single();
        if (cs) await supabase.from("product_stock").update({ stock: cs.stock - product.quantity }).eq("id", cs.id);
      }
    }

    // Handle order_discounts: delete existing, insert new
    await supabase.from("order_discounts").delete().eq("order_id", orderId);
    for (const discount of (input.discounts || [])) {
      await supabase.from("order_discounts").insert({
        order_id: orderId, name: discount.name,
        discount_amount: discount.discount_amount, code: discount.code,
      });
    }

    // Handle payments
    if (input.payments && input.payments.length > 0) {
      const { data: ordMC } = await supabase.from("classes").select("id, module_id, modules!inner(code)").eq("code", "ORD").eq("modules.code", "MOV").single();
      const ordMCId = ordMC?.id || 1;
      const { data: eT } = await supabase.from("types").select("id, module_id, modules!inner(code)").eq("code", "OUT").eq("modules.code", "MOV").single();
      const egressTypeId = eT?.id || 28;
      const { data: iT } = await supabase.from("types").select("id, module_id, modules!inner(code)").eq("code", "INC").eq("modules.code", "MOV").single();
      const ingressTypeId = iT?.id || 27;

      await supabase.from("order_payment").delete().eq("order_id", orderId);

      for (let i = 0; i < input.payments.length; i++) {
        const payment = input.payments[i];
        let rbaId = payment.business_account_id;
        if (!rbaId || rbaId === 0) {
          const { data: pm } = await supabase.from("payment_methods").select("business_account_id").eq("id", payment.payment_method_id).single();
          rbaId = pm?.business_account_id || 1;
        }
        const { data: mov, error: movErr } = await supabase.from("movements").insert({
          amount: payment.amount, branch_id: profile.branch_id, business_account_id: rbaId,
          movement_class_id: ordMCId, movement_type_id: ingressTypeId,
          payment_method_id: payment.payment_method_id, movement_date: payment.date,
          user_id: user.id, description: `Pago actualizado de orden #${orderId}`,
        }).select("id").single();
        if (movErr) { console.error("Error creating movement:", movErr); continue; }
        await supabase.from("order_payment").insert({
          order_id: orderId, payment_method_id: payment.payment_method_id,
          amount: payment.amount, date: payment.date,
          gateway_confirmation_code: payment.confirmation_code,
          voucher_url: payment.voucher_url, movement_id: mov?.id || 0, business_acount_id: rbaId,
        });
      }

      for (const ce of (input.change_entries || [])) {
        let cbaId = ce.business_account_id;
        if (!cbaId || cbaId === 0) { const { data: pm } = await supabase.from("payment_methods").select("business_account_id").eq("id", ce.payment_method_id).single(); cbaId = pm?.business_account_id || 1; }
        const { data: cm, error: cmErr } = await supabase.from("movements").insert({
          amount: ce.amount, branch_id: profile.branch_id, business_account_id: cbaId,
          movement_class_id: ordMCId, movement_type_id: egressTypeId,
          payment_method_id: ce.payment_method_id, movement_date: new Date().toISOString(),
          user_id: user.id, description: `Vuelto de orden #${orderId}`,
        }).select("id").single();
        if (cmErr) { console.error("Error creating change movement:", cmErr); continue; }
        await supabase.from("order_payment").insert({
          order_id: orderId, payment_method_id: ce.payment_method_id,
          amount: -ce.amount, date: new Date().toISOString(),
          movement_id: cm?.id || 0, business_acount_id: cbaId,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, order: { id: orderId } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in update-order:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});