import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentInput {
  payment_method_id: number;
  amount: number;
  date: string;
  confirmation_code?: string | null;
  voucher_url?: string | null;
}

interface ProductInput {
  variation_id: number;
  quantity: number;
  price: number;
  discount_percent: number;
}

interface OrderInput {
  document_type: number;
  document_number: string;
  customer_name: string;
  customer_lastname: string;
  customer_lastname2?: string | null;
  email?: string | null;
  phone?: string | null;
  sale_type: number;
  price_list_id?: number | null;
  shipping_method?: string | null;
  shipping_cost?: number | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  neighborhood_id?: number | null;
  address?: string | null;
  address_reference?: string | null;
  reception_person?: string | null;
  reception_phone?: string | null;
  with_shipping?: boolean;
  employee_sale?: boolean;
  notes?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  products: ProductInput[];
  payments: PaymentInput[];
  initial_situation_id: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const input: OrderInput = await req.json();

    // Get the default status for the module
    const { data: statusData, error: statusError } = await supabase
      .from("situations")
      .select("id, status_id")
      .eq("id", input.initial_situation_id)
      .single();

    if (statusError || !statusData) {
      return new Response(
        JSON.stringify({ error: "Invalid situation ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
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
        user_id: user.id,
        branch_id: profile.branch_id,
        date: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order", details: orderError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get stock movement type ID (VENTA)
    const { data: movementType } = await supabase
      .from("types")
      .select("id")
      .eq("code", "VEN")
      .single();

    const movementTypeId = movementType?.id || 1;

    // Get default stock type ID (PRD - Producto disponible)
    const { data: stockType } = await supabase
      .from("types")
      .select("id")
      .eq("code", "PRD")
      .single();

    const defaultStockTypeId = stockType?.id || 9;

    // Insert order products and create stock movements
    for (const product of input.products) {
      const lineDiscount = product.quantity * product.price * (product.discount_percent / 100);

      // Create stock movement (negative for sales)
      const { data: stockMovement, error: smError } = await supabase
        .from("stock_movements")
        .insert({
          product_variation_id: product.variation_id,
          quantity: -product.quantity,
          warehouse_id: profile.warehouse_id,
          movement_type: movementTypeId,
          stock_type_id: defaultStockTypeId,
          completed: true,
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
        order_id: order.id,
        product_variation_id: product.variation_id,
        quantity: product.quantity,
        product_price: product.price,
        product_discount: lineDiscount,
        warehouses_id: profile.warehouse_id,
        stock_movement_id: stockMovement?.id || 0,
      });

      // Update product stock
      const { data: existingStock } = await supabase
        .from("product_stock")
        .select("id, stock")
        .eq("product_variation_id", product.variation_id)
        .eq("warehouse_id", profile.warehouse_id)
        .eq("stock_type_id", defaultStockTypeId)
        .single();

      if (existingStock) {
        await supabase
          .from("product_stock")
          .update({ stock: existingStock.stock - product.quantity })
          .eq("id", existingStock.id);
      }
    }

    // Get movement class for income (INGRESO)
    const { data: movementClass } = await supabase
      .from("types")
      .select("id")
      .eq("code", "ING")
      .single();

    const movementClassId = movementClass?.id || 1;

    // Get movement type for sales (VENTA)
    const { data: saleMovementType } = await supabase
      .from("types")
      .select("id")
      .eq("code", "VEN")
      .single();

    const saleMovementTypeId = saleMovementType?.id || 1;

    // Insert payments and return their IDs
    const createdPayments: Array<{ id: number; localIndex: number }> = [];

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
          description: `Pago de orden #${order.id}`,
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
          order_id: order.id,
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
        createdPayments.push({ id: orderPayment.id, localIndex: i });
      }
    }

    // Create order situation
    await supabase.from("order_situations").insert({
      order_id: order.id,
      situation_id: input.initial_situation_id,
      status_id: statusData.status_id,
      last_row: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order: { id: order.id },
        payments: createdPayments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-order:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
