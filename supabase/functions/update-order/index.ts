import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for branch and warehouse
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("branch_id, warehouse_id")
      .eq("UID", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const input = await req.json();
    const orderId = input.order_id;
    const situationId = input.situation_id;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the order exists and belongs to this user
    const { data: existingOrder, error: orderCheckError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (orderCheckError || !existingOrder) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingOrder.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You can only update your own orders" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the CURRENT situation of the order to determine stock movement flags
    let stockIsActive = true;
    let stockCompleted = true;

    // Always fetch the current situation from order_situations (not from input)
    const { data: currentSituation } = await supabase
      .from("order_situations")
      .select("situation_id, situations!inner(code)")
      .eq("order_id", orderId)
      .eq("last_row", true)
      .single();

    const currentSituationCode = (currentSituation?.situations as { code: string } | null)?.code;
    console.log("Current order situation code:", currentSituationCode);

    if (currentSituationCode) {
      switch (currentSituationCode) {
        case "PHY":
          stockIsActive = true;
          stockCompleted = true;
          break;
        case "HDN":
          stockIsActive = false;
          stockCompleted = false;
          break;
        case "VIR":
          stockIsActive = true;
          stockCompleted = false;
          break;
        default:
          stockIsActive = true;
          stockCompleted = true;
      }
    }

    console.log("Stock movement flags - is_active:", stockIsActive, "completed:", stockCompleted);

    // Get movement type IDs - use ORD for sales (not VEN)
    const { data: movementType } = await supabase
      .from("types")
      .select("id, module_id, modules!inner(code)")
      .eq("code", "ORD")
      .eq("modules.code", "STM")
      .single();
    const movementTypeId = movementType?.id || 4;
    console.log("Movement type for sales (ORD):", movementTypeId);

    // For reversal, we use the same sale type (ORD) with positive quantity
    // This represents the reversal of the original sale movement
    const reversalTypeId = movementTypeId;

    // Step 1: Get existing order products and their stock movements (including stock_type_id from the movement)
    const { data: existingProducts } = await supabase
      .from("order_products")
      .select("id, product_variation_id, quantity, warehouses_id, stock_movement_id")
      .eq("order_id", orderId);

    // Step 2: Reverse stock movements for existing products
    for (const product of existingProducts || []) {
      // Get the original stock_type_id and completed status from the stock movement
      const { data: originalMovement } = await supabase
        .from("stock_movements")
        .select("stock_type_id, completed")
        .eq("id", product.stock_movement_id)
        .single();

      const originalStockTypeId = originalMovement?.stock_type_id || 9;
      const wasCompleted = originalMovement?.completed || false;

      // Create reverse stock movement (positive to restore stock)
      await supabase.from("stock_movements").insert({
        product_variation_id: product.product_variation_id,
        quantity: product.quantity, // Positive to restore
        warehouse_id: product.warehouses_id,
        movement_type: reversalTypeId,
        stock_type_id: originalStockTypeId,
        is_active: true,
        completed: true,
        created_by: user.id,
        vinculated_movement_id: product.stock_movement_id,
      });

      // Restore product stock only if original movement was completed
      if (wasCompleted) {
        const { data: existingStock } = await supabase
          .from("product_stock")
          .select("id, stock")
          .eq("product_variation_id", product.product_variation_id)
          .eq("warehouse_id", product.warehouses_id)
          .eq("stock_type_id", originalStockTypeId)
          .single();

        if (existingStock) {
          await supabase
            .from("product_stock")
            .update({ stock: existingStock.stock + product.quantity })
            .eq("id", existingStock.id);
        }
      }
    }

    // Step 3: Delete existing order products
    await supabase.from("order_products").delete().eq("order_id", orderId);

    // Step 4: Update the order (customer_lastname already arrives concatenated from frontend)
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        document_type: input.document_type,
        document_number: input.document_number,
        customer_name: input.customer_name,
        customer_lastname: input.customer_lastname,
        email: input.email,
        phone: input.phone ? parseInt(input.phone) : null,
        sale_type_id: input.sale_type,
        shipping_method_code: input.shipping_method,
        shipping_cost: input.shipping_cost,
        country_id: input.country_id,
        state_id: input.state_id,
        city_id: input.city_id,
        neighborhood_id: input.neighborhood_id,
        address: input.address,
        address_reference: input.address_reference,
        reception_person: input.reception_person,
        reception_phone: input.reception_phone ? parseInt(input.reception_phone) : null,
        subtotal: input.subtotal,
        discount: input.discount,
        total: input.total,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Insert new order products and create stock movements
    for (const product of input.products || []) {
      const lineDiscount = product.discount_amount * product.quantity;
      const productStockTypeId = product.stock_type_id;

      // Create stock movement (negative for sales) with appropriate is_active/completed
      const { data: stockMovement, error: smError } = await supabase
        .from("stock_movements")
        .insert({
          product_variation_id: product.variation_id,
          quantity: -product.quantity,
          warehouse_id: profile.warehouse_id,
          movement_type: movementTypeId,
          stock_type_id: productStockTypeId,
          is_active: stockIsActive,
          completed: stockCompleted,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (smError) {
        console.error("Error creating stock movement:", smError);
        continue;
      }

      // Insert order product
      await supabase.from("order_products").insert({
        order_id: orderId,
        product_variation_id: product.variation_id,
        quantity: product.quantity,
        product_price: product.price,
        product_discount: lineDiscount,
        warehouses_id: profile.warehouse_id,
        stock_movement_id: stockMovement?.id || 0,
      });

      // Update product stock only if stock movement is completed
      if (stockCompleted) {
        const { data: currentStock } = await supabase
          .from("product_stock")
          .select("id, stock")
          .eq("product_variation_id", product.variation_id)
          .eq("warehouse_id", profile.warehouse_id)
          .eq("stock_type_id", productStockTypeId)
          .single();

        if (currentStock) {
          await supabase
            .from("product_stock")
            .update({ stock: currentStock.stock - product.quantity })
            .eq("id", currentStock.id);
        }
      }
    }

    // Step 6: Handle payments update (optional - only if payments are provided)
    if (input.payments && input.payments.length > 0) {
      // Get movement class for income (INGRESO)
      const { data: movementClass } = await supabase
        .from("types")
        .select("id")
        .eq("code", "ING")
        .single();
      const movementClassId = movementClass?.id || 1;

      // Get movement type for sales
      const { data: saleMovementType } = await supabase
        .from("types")
        .select("id")
        .eq("code", "VEN")
        .single();
      const saleMovementTypeId = saleMovementType?.id || 1;

      // Delete existing payments (movements are kept for audit)
      await supabase.from("order_payment").delete().eq("order_id", orderId);

      // Insert new payments
      const createdPayments = [];
      for (let i = 0; i < input.payments.length; i++) {
        const payment = input.payments[i];

        // Get payment method to find business account
        const { data: paymentMethod } = await supabase
          .from("payment_methods")
          .select("business_account_id")
          .eq("id", payment.payment_method_id)
          .single();

        // Create financial movement
        const { data: movement, error: movError } = await supabase
          .from("movements")
          .insert({
            amount: payment.amount,
            branch_id: profile.branch_id,
            business_account_id: paymentMethod?.business_account_id || 1,
            movement_class_id: movementClassId,
            movement_type_id: saleMovementTypeId,
            payment_method_id: payment.payment_method_id,
            movement_date: payment.date,
            user_id: user.id,
            description: `Pago actualizado de orden #${orderId}`,
          })
          .select("id")
          .single();

        if (movError) {
          console.error("Error creating movement:", movError);
          continue;
        }

        // Insert order payment
        const { data: orderPayment, error: opError } = await supabase
          .from("order_payment")
          .insert({
            order_id: orderId,
            payment_method_id: payment.payment_method_id,
            amount: payment.amount,
            date: payment.date,
            gateway_confirmation_code: payment.confirmation_code,
            voucher_url: payment.voucher_url,
            movement_id: movement?.id || 0,
          })
          .select("id")
          .single();

        if (!opError && orderPayment) {
          createdPayments.push({
            id: orderPayment.id,
            localIndex: i,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: { id: orderId },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-order:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
