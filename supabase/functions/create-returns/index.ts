import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReturnProduct {
  product_variation_id: number;
  quantity: number;
  product_amount: number;
  output: boolean;
  vinculated_index?: number | null; // Index of the return product this exchange is linked to
}

interface CreateReturnPayload {
  order_id: number;
  return_type_id: number;
  return_type_code: string;
  customer_document_number: string;
  customer_document_type_id: number;
  reason: string;
  shipping_return: boolean;
  shipping_cost?: number;
  situation_id: number;
  situation_code: string;
  status_id: number;
  module_id: number;
  total_refund_amount: number;
  total_exchange_difference: number;
  return_products: ReturnProduct[];
  payment_method_id: number;
  business_account_id: number;
  branch_id: number;
  warehouse_id: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const payload: CreateReturnPayload = await req.json();

    console.log("Creating return with payload:", JSON.stringify(payload, null, 2));

    // Determine stock movement flags based on situation code
    let isActive = false;
    let completed = false;

    switch (payload.situation_code) {
      case "PHY":
        isActive = true;
        completed = true;
        break;
      case "VIR":
        isActive = true;
        completed = false;
        break;
      case "HDN":
      default:
        isActive = false;
        completed = false;
        break;
    }

    // Get the stock movement type for returns (RTU code in STM module)
    const { data: movementTypeData } = await supabase
      .from("types")
      .select("id, modules!inner(code)")
      .eq("code", "RTU")
      .eq("modules.code", "STM")
      .single();

    const movementTypeId = movementTypeData?.id || 5;

    // Get movement class for returns
    const { data: movementClassData } = await supabase
      .from("classes")
      .select("id")
      .eq("code", "RTU")
      .single();

    const movementClassId = movementClassData?.id || 1;

    // Get movement type for financial movements (egreso/ingreso)
    const { data: egressTypeData } = await supabase
      .from("types")
      .select("id")
      .eq("code", "OUT")
      .single();

    const { data: incomeTypeData } = await supabase
      .from("types")
      .select("id")
      .eq("code", "INC")
      .single();

    // Create the return record
    const { data: returnData, error: returnError } = await supabase
      .from("returns")
      .insert({
        order_id: payload.order_id,
        return_type_id: payload.return_type_id,
        customer_document_number: payload.customer_document_number,
        customer_document_type_id: payload.customer_document_type_id,
        reason: payload.reason,
        shipping_return: payload.shipping_return,
        situation_id: payload.situation_id,
        status_id: payload.status_id,
        created_by: user.id,
        module_id: payload.module_id,
        total_refund_amount: payload.total_refund_amount,
        total_exchange_difference: payload.total_exchange_difference,
      })
      .select()
      .single();

    if (returnError) {
      console.error("Error creating return:", returnError);
      throw new Error(`Failed to create return: ${returnError.message}`);
    }

    console.log("Return created:", returnData.id);

    // Create initial return situation
    await supabase.from("return_situations").insert({
      return_id: returnData.id,
      module_id: payload.module_id,
      situation_id: payload.situation_id,
      status_id: payload.status_id,
      last_row: true,
      created_by: user.id,
    });

    // Process each return product
    // First pass: create all products and store their IDs
    const createdProducts: { 
      id: number; 
      product_variation_id: number; 
      output: boolean;
      vinculated_index?: number | null;
    }[] = [];

    for (let i = 0; i < payload.return_products.length; i++) {
      const product = payload.return_products[i];

      // Create stock movement for each product
      // For returns (output=false): stock increases (positive quantity)
      // For exchanges (output=true): stock decreases (negative quantity)
      const stockQuantity = product.output ? -product.quantity : product.quantity;

      const { data: stockMovement, error: stockError } = await supabase
        .from("stock_movements")
        .insert({
          product_variation_id: product.product_variation_id,
          quantity: stockQuantity,
          created_by: user.id,
          movement_type: movementTypeId,
          warehouse_id: payload.warehouse_id,
          completed: completed,
          is_active: isActive,
          stock_type_id: 1, // Default stock type
        })
        .select()
        .single();

      if (stockError) {
        console.error("Error creating stock movement:", stockError);
        throw new Error(`Failed to create stock movement: ${stockError.message}`);
      }

      // Create return product record (without vinculation for now)
      const { data: returnProduct, error: productError } = await supabase
        .from("returns_products")
        .insert({
          return_id: returnData.id,
          product_variation_id: product.product_variation_id,
          quantity: product.quantity,
          product_amount: product.product_amount,
          output: product.output,
          stock_movement_id: stockMovement.id,
          vinculated_return_product_id: null, // Will be updated in second pass
        })
        .select()
        .single();

      if (productError) {
        console.error("Error creating return product:", productError);
        throw new Error(`Failed to create return product: ${productError.message}`);
      }

      createdProducts.push({
        id: returnProduct.id,
        product_variation_id: product.product_variation_id,
        output: product.output,
        vinculated_index: product.vinculated_index,
      });

      // Update product stock if movement is completed
      if (completed) {
        const { data: currentStock } = await supabase
          .from("product_stock")
          .select("stock")
          .eq("product_variation_id", product.product_variation_id)
          .eq("warehouse_id", payload.warehouse_id)
          .eq("stock_type_id", 1)
          .single();

        if (currentStock) {
          await supabase
            .from("product_stock")
            .update({ stock: currentStock.stock + stockQuantity })
            .eq("product_variation_id", product.product_variation_id)
            .eq("warehouse_id", payload.warehouse_id)
            .eq("stock_type_id", 1);
        }
      }
    }

    // Second pass: update vinculated_return_product_id for exchange products
    for (const product of createdProducts) {
      if (product.vinculated_index !== undefined && product.vinculated_index !== null) {
        const vinculatedProductId = createdProducts[product.vinculated_index]?.id;
        if (vinculatedProductId) {
          await supabase
            .from("returns_products")
            .update({ vinculated_return_product_id: vinculatedProductId })
            .eq("id", product.id);
        }
      }
    }

    // Determine payment amount
    let paymentAmount = 0;
    let movementTypeIdForPayment = egressTypeData?.id || 28; // Default to egreso

    if (payload.total_refund_amount > 0) {
      // Refund to customer (egreso)
      paymentAmount = payload.total_refund_amount;
      movementTypeIdForPayment = egressTypeData?.id || 28;
    } else if (payload.total_exchange_difference > 0) {
      // Customer pays difference (ingreso)
      paymentAmount = payload.total_exchange_difference;
      movementTypeIdForPayment = incomeTypeData?.id || 27;
    }

    // Add shipping cost if applicable
    if (payload.shipping_return && payload.shipping_cost && payload.shipping_cost > 0) {
      paymentAmount += payload.shipping_cost;
    }

    // Create financial movement if there's an amount
    if (paymentAmount > 0) {
      const { data: movementData, error: movementError } = await supabase
        .from("movements")
        .insert({
          movement_class_id: movementClassId,
          movement_type_id: movementTypeIdForPayment,
          description: `Devolución/Cambio #${returnData.id}`,
          amount: paymentAmount,
          movement_date: new Date().toISOString(),
          business_account_id: payload.business_account_id,
          user_id: user.id,
          payment_method_id: payload.payment_method_id,
          branch_id: payload.branch_id,
        })
        .select()
        .single();

      if (movementError) {
        console.error("Error creating movement:", movementError);
        throw new Error(`Failed to create movement: ${movementError.message}`);
      }

      // Create return payment record
      await supabase.from("return_payments").insert({
        return_id: returnData.id,
        movement_id: movementData.id,
        payment_method_id: payload.payment_method_id,
        amount: paymentAmount,
        payment_date: new Date().toISOString(),
        created_by: user.id,
      });

      console.log("Payment created with amount:", paymentAmount);
    }

    return new Response(
      JSON.stringify({
        success: true,
        return_id: returnData.id,
        created_products: createdProducts.map(p => ({ id: p.id, output: p.output })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-returns:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
