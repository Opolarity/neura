import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-channel-code",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const channel = req.headers.get('x-channel-code');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Validate channel code
    const channelInfo = await supabaseClient.from('channels').select('*').eq('code', channel).single();
    if (channelInfo.error || !channelInfo.data) {
      console.error('Channel validation error:', channelInfo.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Código de canal inválido',
        details: channelInfo.error ? channelInfo.error.message : 'No channel found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "El body debe ser un JSON válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = body;

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "El parámetro order_id es obligatorio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Token inválido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabaseClient.rpc("sp_ec_get_order_details", {
      p_user_id: user.id,
      p_order_id: parseInt(order_id),
      p_price_list_id: channelInfo.data?.price_list_id,
      p_branch_id: channelInfo.data?.branch_id,
      p_warehouse_id: channelInfo.data?.warehouse_id,
      p_stock_type_id: channelInfo.data?.stock_type_id,
      p_sale_type_id: channelInfo.data?.sale_type_id,
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