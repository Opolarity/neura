import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS", 
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !authHeader) throw new Error("Configuración faltante");

    if (req.method !== "PATCH") {
      return new Response(
          JSON.stringify({ error: "Method not allowed. Usa PATCH para el borrado virtual." }), 
          { status: 405, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Token inválido." }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Falta el 'id' para desactivar la cuenta." }), { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase.rpc("sp_delete_business_account", {
      p_id: id
    });

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});