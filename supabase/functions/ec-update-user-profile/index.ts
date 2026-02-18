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
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !authHeader) {
      throw new Error("Configuración del servidor faltante");
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parsear body
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ success: false, error: "Body JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar campos obligatorios en el body ANTES de llamar a la BD
    const { name, last_name, address, country_id, state_id, city_id, neighborhood_id , email } = body as {
      name?: string;
      last_name?: string;
      address?: string;
      country_id?: number;
      state_id?: number;
      city_id?: number;
      neighborhood_id?: number;
      email?: string    
    };

    if (!name || String(name).trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "El campo 'name' es obligatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!last_name || String(last_name).trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "El campo 'last_name' es obligatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autenticación
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Token inválido o expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Llamar al stored procedure — document_number nunca se envía
    const { data, error } = await supabase.rpc("sp_ec_update_user_profile", {
      p_user_id:         user.id,
      p_name:            String(name).trim(),
      p_last_name:       String(last_name).trim(),
      p_address:         address         ?? null,
      p_country_id:      country_id      ?? null,
      p_state_id:        state_id        ?? null,
      p_city_id:         city_id         ?? null,
      p_neighborhood_id: neighborhood_id ?? null,
      p_email:           email           ?? null
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