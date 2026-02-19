import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS, GET",
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
      throw new Error("Configuración del servidor o Token faltante");
    }

    if (req.method !== "POST" && req.method !== "PUT") {
      return new Response(JSON.stringify({ error: "Use POST o PUT" }), { status: 405, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado. Token inválido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("UID", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Perfil de usuario no encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "El cuerpo de la petición no es un JSON válido o está vacío." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { 
      id, 
      name, 
      bank, 
      account_number, 
      total_amount, 
      business_account_type_id 
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "El ID de la cuenta es obligatorio para actualizar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleanAccountNumber = account_number;
    if (typeof account_number === 'string' || typeof account_number === 'number') {
        cleanAccountNumber = String(account_number).replace(/\D/g, "");
    } else {
        cleanAccountNumber = null; 
    }

    const { data, error } = await supabase.rpc("sp_update_business_account", {
      p_id: parseInt(id),
      p_name: name,
      p_bank: bank,
      p_account_number: cleanAccountNumber ? Number(cleanAccountNumber) : null,
      p_total_amount: total_amount ? Number(total_amount) : null, 
      p_business_account_type_id: business_account_type_id ? parseInt(business_account_type_id) : null,
      p_user_id: user.id,
      p_branch_id: profile.branch_id // ¡ESTÁ DE REGRESO!
    });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), { 
      status: data.success ? 200 : 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno: " + (error.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});