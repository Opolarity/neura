import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !authHeader) {
      throw new Error("Configuración faltante");
    }

    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use GET." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const country_id_str = url.searchParams.get("country_id");
    const state_id_str = url.searchParams.get("state_id");
    const city_id_str = url.searchParams.get("city_id");
    const neighborhood_id_str = url.searchParams.get("neighborhood_id");

    if (!country_id_str) {
      return new Response(
        JSON.stringify({ error: "El parámetro country_id es obligatorio en la URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await supabase.rpc("sp_ec_get_shipping_methods", {
      p_country_id: parseInt(country_id_str),
      p_state_id: state_id_str ? parseInt(state_id_str) : null,
      p_city_id: city_id_str ? parseInt(city_id_str) : null,
      p_neighborhood_id: neighborhood_id_str ? parseInt(neighborhood_id_str) : null
    });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error_supabase: error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    const errorMessage = error.message ? error.message : JSON.stringify(error);
    
    return new Response(
      JSON.stringify({ success: false, error_critico: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});