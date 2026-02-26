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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from auth header
    
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

    // Resolve price_list_code from price_list_id
    let priceListCode: string | null = null;
    if (input.price_list_id) {
      const { data: priceListData } = await supabase
        .from("price_list")
        .select("code")
        .eq("id", parseInt(input.price_list_id))
        .single();
      priceListCode = priceListData?.code || null;
    }

    // Build order data object
    const orderData = {
      document_type: input.document_type,
      document_number: input.document_number,
      customer_name: input.customer_name,
      customer_lastname: input.customer_lastname,
      customer_lastname_first: input.customer_lastname_first,
      customer_lastname2: input.customer_lastname2,
      email: input.email,
      phone: input.phone,
      sale_type: input.sale_type,
      price_list_code: priceListCode,
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
      total: input.total,
      change: input.change || 0
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
      voucher_url: p.voucher_url,
      business_account_id: p.business_account_id || null,
    }));

    // Build change entries array
    const changeEntries = (input.change_entries || []).map((e: any) => ({
      payment_method_id: e.payment_method_id,
      amount: e.amount,
      business_account_id: e.business_account_id || null,
    }));

    // Determine if we need to create the client (if not existing)
    const isExistingClient = input.is_existing_client === true;

    // Ensure the account has the CLI type (client type) linked to CUT module
    // First, get the CLI type id
    const { data: cliType } = await supabase
      .from("modules")
      .select("types(id)")
      .eq("code", "CUT")
      .single();

    const cliTypeId = cliType?.types?.find((t: any) => true)?.id; // Get any type from CUT module with CLI code
    
    // Actually we need to find the type with code CLI linked to module CUT
    const { data: typeData } = await supabase
      .from("types")
      .select("id, module_id, modules!inner(code)")
      .eq("code", "CLI")
      .eq("modules.code", "CUT")
      .single();

    if (typeData) {
      // Check if account already has this type
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("document_number", input.document_number)
        .single();

      if (existingAccount) {
        // Check if account already has CLI type
        const { data: existingType } = await supabase
          .from("account_types")
          .select("id")
          .eq("account_id", existingAccount.id)
          .eq("account_type_id", typeData.id)
          .single();

        if (!existingType) {
          // Add CLI type to account
          await supabase
            .from("account_types")
            .insert({
              account_id: existingAccount.id,
              account_type_id: typeData.id
            });
          console.log(`Added CLI type to account ${existingAccount.id}`);
        }
      }
    }

    // Call the transactional RPC
    const { data, error } = await supabase.rpc("sp_create_order", {
      p_user_id: user.id,
      p_branch_id: profile.branch_id,
      p_warehouse_id: profile.warehouse_id,
      p_order_data: orderData,
      p_products: products,
      p_payments: payments,
      p_initial_situation_id: input.initial_situation_id,
      p_is_existing_client: isExistingClient,
      p_change_entries: changeEntries
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
