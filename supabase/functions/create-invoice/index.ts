import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // Validate auth using anon key + user's Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const input = await req.json();

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_type_id: input.invoice_type_id,
        tax_serie: input.tax_serie || null,
        invoice_number: input.invoice_number || null,
        declared: input.declared ?? false,
        customer_document_type_id: input.customer_document_type_id || 0,
        customer_document_number: input.customer_document_number || ' ',
        client_name: input.client_name || null,
        client_email: input.client_email || null,
        client_address: input.client_address || null,
        total_amount: input.total_amount,
        total_taxes: input.total_taxes || null,
        total_free: input.total_free || null,
        total_others: input.total_others || null,
        created_by: userId,
        customer_document_estate_code: input.customer_document_estate_code || null,
        vinculated_invoice_id: input.vinculated_invoice_id || null,
      })
      .select("id")
      .single();

    if (invoiceError) {
      console.error("Error inserting invoice:", invoiceError);
      return new Response(JSON.stringify({ error: "Failed to create invoice", details: invoiceError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert items
    const itemsToInsert = input.items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      measurement_unit: item.measurement_unit,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      igv: item.igv,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting invoice items:", itemsError);
      return new Response(JSON.stringify({ error: "Failed to create invoice items", details: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Link invoice to order if order_id is provided
    if (input.order_id) {
      const { error: linkError } = await supabase
        .from("order_invoices")
        .insert({
          order_id: input.order_id,
          invoice_id: invoice.id,
        });

      if (linkError) {
        console.error("Error linking invoice to order:", linkError);
      }
    }

    return new Response(JSON.stringify({ success: true, invoice: { id: invoice.id } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-invoice:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
