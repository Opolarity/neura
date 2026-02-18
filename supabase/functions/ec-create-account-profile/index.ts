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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuración del servidor faltante");
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    const { 
      email, password, dni, nombre, lastname1, 
      lastname2 = null, nickname = null, tipo_documento_id 
    } = body;

    if (!email || !password || !dni || !nombre || !lastname1 || !tipo_documento_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan datos obligatorios (email, password, dni, nombre, lastname1, tipo_documento_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUid = authData.user.id;

    const { data: dbData, error: dbError } = await supabaseAdmin.rpc("sp_ec_create_account_profile", {
      p_auth_uid: newUid,
      p_dni: dni,
      p_nombre: nombre,
      p_lastname1: lastname1,
      p_lastname2: lastname2,
      p_nickname: nickname,
      p_tipo_documento_id: tipo_documento_id
    });

    if (dbError || (dbData && dbData.success === false)) {
      await supabaseAdmin.auth.admin.deleteUser(newUid);
      
      const errorMessage = dbError ? dbError.message : dbData.error;
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Cuenta de cliente creada exitosamente", data: dbData.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});