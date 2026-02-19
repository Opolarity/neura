import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PUT, OPTIONS", 
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

    if (req.method !== "PUT") {
      return new Response(
          JSON.stringify({ error: "Method not allowed. Solo se permite PUT para actualizar." }), 
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
    const { id, name, bank, account_number, total_amount, business_account_type_id } = body;

    if (!id) {
        return new Response(JSON.stringify({ success: false, error: "El 'id' es obligatorio." }), { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase.rpc("sp_update_business_account", {
      p_id: id,
      p_name: name !== undefined ? name : null,
      p_bank: bank !== undefined ? bank : null,
      p_account_number: account_number !== undefined ? account_number : null,
      p_total_amount: total_amount !== undefined ? total_amount : null,
      p_business_account_type_id: business_account_type_id !== undefined ? business_account_type_id : null
    });

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});