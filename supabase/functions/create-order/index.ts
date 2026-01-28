import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get user profile for branch and warehouse
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("branch_id, warehouse_id")
      .eq("UID", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const input = await req.json();

    // Build order data object
    const orderData = {
      document_type: input.document_type,
      document_number: input.document_number,
      customer_name: input.customer_name,
      customer_lastname: input.customer_lastname,
      email: input.email,
      phone: input.phone,
      sale_type: input.sale_type,
      shipping_method: input.shipping_method,
      shipping_cost: input.shipping_cost,
      country_id: input.country_id,
      state_id: input.state_id,
      city_id: input.city_id,
      neighborhood_id: input.neighborhood_id,
      address: input.address,
      address_reference: input.address_reference,
      reception_person: input.reception_person,
      reception_phone: input.reception_phone,
      subtotal: input.subtotal,
      discount: input.discount,
      total: input.total
    };

    // Build products array
    const products = input.products.map((p: any) => ({
      variation_id: p.variation_id,
      quantity: p.quantity,
      price: p.price,
      discount_amount: p.discount_amount || 0,
      stock_type_id: p.stock_type_id
    }));

    // Build payments array
    const payments = input.payments.map((p: any) => ({
      payment_method_id: p.payment_method_id,
      amount: p.amount,
      date: p.date,
      confirmation_code: p.confirmation_code,
      voucher_url: p.voucher_url
    }));

    // Call the transactional RPC
    const { data, error } = await supabase.rpc("sp_create_order", {
      p_user_id: user.id,
      p_branch_id: profile.branch_id,
      p_warehouse_id: profile.warehouse_id,
      p_order_data: orderData,
      p_products: products,
      p_payments: payments,
      p_initial_situation_id: input.initial_situation_id
    });

    if (error) {
      console.error("Error calling sp_create_order:", error);
      return new Response(JSON.stringify({ error: "Failed to create order", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      order: { id: data.order_id },
      payments: data.payments
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in create-order:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
