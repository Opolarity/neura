import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { chanelTypeId } = await req.json();

    if (!chanelTypeId) {
      throw new Error("Channel Type ID is required");
    }

    console.log("Fetching channel type details for ID:", chanelTypeId);

    // Fetch channel type basic data
    const { data: chanelType, error: chanelTypeError } = await supabase
      .from("types")
      .select("id, name, code, module_id")
      .eq("id", chanelTypeId)
      .single();

    if (chanelTypeError) throw chanelTypeError;
    if (!chanelType) throw new Error("Channel type not found");

    // Fetch associated payment methods
    const { data: paymentMethods, error: paymentMethodsError } = await supabase
      .from("payment_method_sale_type")
      .select("payment_method_id")
      .eq("sale_type_id", chanelTypeId);

    if (paymentMethodsError) throw paymentMethodsError;

    const paymentMethodIds = (paymentMethods ?? []).map(
      (pm) => pm.payment_method_id
    );

    const response = {
      chanelType: {
        id: chanelType.id,
        name: chanelType.name,
        code: chanelType.code,
        moduleId: chanelType.module_id,
      },
      paymentMethodIds,
    };

    console.log("Channel type details fetched successfully");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-channel-type-details:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});